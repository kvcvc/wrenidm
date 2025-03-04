/**
 * The contents of this file are subject to the terms of the Common Development and
 * Distribution License (the License). You may not use this file except in compliance with the
 * License.
 *
 * You can obtain a copy of the License at legal/CDDLv1.0.txt. See the License for the
 * specific language governing permission and limitations under the License.
 *
 * When distributing Covered Software, include this CDDL Header Notice in each file and include
 * the License file at legal/CDDLv1.0.txt. If applicable, add the following below the CDDL
 * Header, with the fields enclosed by brackets [] replaced by your own identifying
 * information: "Portions copyright [year] [name of copyright owner]".
 *
 * Copyright 2015-2016 ForgeRock AS.
 */

define([
    "jquery",
    "underscore",
    "bootstrap",
    "handlebars",
    "dimple",
    "form2js",
    "org/forgerock/openidm/ui/common/dashboard/widgets/AbstractWidget",
    "org/forgerock/openidm/ui/admin/delegates/ReconDelegate",
    "org/forgerock/commons/ui/common/util/DateUtil",
    "org/forgerock/openidm/ui/admin/delegates/SyncDelegate",
    "moment"
], function($, _, bootstrap, handlebars,
        dimple,
        form2js,
        AbstractWidget,
        ReconDelegate,
        DateUtil,
        SyncDelegate,
        moment) {
    var widgetInstance = {},
        Widget = AbstractWidget.extend({
            template: "templates/admin/dashboard/widgets/MappingReconResultsWidgetTemplate.html",
            model : {
                lookup: {
                    "SOURCE_MISSING": "Source Missing",
                    "SOURCE_IGNORED": "Source Ignored",
                    "UNQUALIFIED": "Unqualified",
                    "AMBIGUOUS": "Ambiguous",
                    "FOUND_ALREADY_LINKED": "Found Already Linked",
                    "CONFIRMED": "Confirmed",
                    "UNASSIGNED": "Unassigned",
                    "LINK_ONLY": "Link Only",
                    "TARGET_IGNORED": "Target Ignored",
                    "MISSING": "Missing",
                    "ABSENT": "Absent",
                    "FOUND": "Found"
                },
                "svgWidth" : "100%",
                "svgHeight" : 400,
                "chartTick" : 5,
                "chartMarginLeft" : "90px",
                "chartMarginTop" : "30px",
                "chartMarginRight" : "90px",
                "chartMarginBottom" : "125px",
                "overrideTemplate" : "dashboard/widget/_reconResultConfig"
            },

            widgetRender: function(args, callback) {
                var currentMapping = null;
                this.model.barchart = args.widget.barchart;

                this.partials.push("partials/dashboard/widget/_reconResultConfig.html");
                this.partials.push("partials/_popover.html");

                SyncDelegate.mappingDetails().then(_.bind(function(sync){
                    this.data.sync = sync;

                    currentMapping = _.find(this.data.sync.mappings, function(mapping){
                        return mapping.recon;
                    });

                    if (!currentMapping && this.data.sync.mappings) {
                        currentMapping = this.data.sync.mappings[0];
                    }

                    if (currentMapping) {
                        if (currentMapping.recon) {
                            currentMapping.recon.convertedTime = DateUtil.formatDate(currentMapping.recon.ended, "MMMM dd, yyyy HH:mm");
                            currentMapping.recon.convertedDuration = moment.utc(currentMapping.recon.duration).format("HH:mm:ss:SSS");

                            this.reconResultRender(currentMapping, currentMapping.recon, callback);
                        } else {
                            this.reconResultRender(currentMapping, null, callback);
                        }
                    } else {
                        this.reconResultRender(null, null, callback);
                    }
                }, this));
            },

            reconResultRender: function(mapping, recon, callback) {
                const goodColor = "#70a796";
                const warningColor = "#e6bf24";
                const dangerColor = "#ca3127";

                var svg,
                    list = $('<ul class="recon-list"></ul>'),
                    orderCounter = 0;

                this.data.mapping = mapping;
                this.data.recon = recon;
                this.data.situationDetails = [];
                this.data.showPopover = false;

                _.each(this.data.sync.mappings, function(mapping){
                    if (mapping.name !== this.data.mapping.name && mapping.recon) {
                        list.append('<li data-order="' + orderCounter + '" class="recon-list-item">' + mapping.name  + '</li>');
                    }
                    orderCounter++;
                }, this);

                if (list.find('li').length > 0) {
                    this.data.showPopover = true;
                }

                this.parentRender(_.bind(function(){
                    $(window).unbind("resize.reconBarChart");

                    if (this.data.showPopover) {
                        this.$el.find(".recon-widget-header .title").popover({
                            content: _.bind(function () {
                                //Some event clean up here to ensure clicks only fired once
                                list.find(".recon-list-item").unbind("click");

                                list.find(".recon-list-item").click(_.bind(function (event) {
                                    this.mappingSelected(event);
                                }, this));

                                return list;
                            }, this),
                            template: handlebars.compile("{{> _popover popoverClass='recon-popover'}}")(),
                            trigger: 'click',
                            placement: 'bottom',
                            container: 'body',
                            html: 'true',
                            title: ''
                        });
                    }

                    //This piece of code builds and adds the barchart
                    if (recon && (this.model.barchart === true || this.model.barchart === "true")) {
                        _.each(recon.situationSummary, function(value, key) {
                            this.data.situationDetails.push({
                                "Situation": this.model.lookup[key],
                                "Raw Situation": key,
                                "Records": value
                            });
                        }, this);

                        svg = dimple.newSvg(".recon-chart", this.model.svgWidth, this.model.svgHeight);

                        this.model.chart = new dimple.chart(svg, this.data.situationDetails);
                        this.model.chart.setMargins(this.model.chartMarginLeft, this.model.chartMarginTop, this.model.chartMarginRight, this.model.chartMarginBottom);

                        this.model.typeCategory = this.model.chart.addCategoryAxis("x", "Situation");
                        this.model.typeCategory.addOrderRule(["Ambiguous", "Source Missing", "Missing", "Found Already Linked", "Unqualified", "Unassigned", "Target Ignored", "Source Ignored", "Confirmed", "Found", "Absent"]);

                        this.model.typeRecord = this.model.chart.addMeasureAxis("y", "Records");
                        this.model.typeRecord.ticks = this.model.chartTick;

                        this.model.chart.addSeries("Raw Situation", dimple.plot.bar);

                        this.model.chart.assignColor("CONFIRMED", goodColor);
                        this.model.chart.assignColor("FOUND", goodColor);
                        this.model.chart.assignColor("ABSENT", goodColor);
                        this.model.chart.assignColor("SOURCE_IGNORED", warningColor);
                        this.model.chart.assignColor("TARGET_IGNORED", warningColor);
                        this.model.chart.assignColor("AMBIGUOUS", dangerColor);
                        this.model.chart.assignColor("SOURCE_MISSING", dangerColor);
                        this.model.chart.assignColor("MISSING",dangerColor);
                        this.model.chart.assignColor("FOUND_ALREADY_LINKED", dangerColor);
                        this.model.chart.assignColor("UNQUALIFIED", dangerColor);
                        this.model.chart.assignColor("UNASSIGNED", dangerColor);

                        this.model.chart.draw(1000);

                        this.model.typeRecord.shapes.selectAll("path,line").remove();
                        this.model.typeCategory.shapes.selectAll("path,line").remove();
                        this.model.typeRecord.titleShape.text("");
                        this.model.typeCategory.titleShape.text("");
                    }

                    if (callback) {
                        callback();
                    }
                }, this));
            },

            resize: function() {
                if (this.model.chart) {
                    this.model.chart.draw(0, true);
                    this.model.typeRecord.shapes.selectAll("path,line").remove();
                    this.model.typeCategory.shapes.selectAll("path,line").remove();
                    this.model.typeRecord.titleShape.text("");
                    this.model.typeCategory.titleShape.text("");
                }
            },

            mappingSelected: function(event) {
                event.preventDefault();

                var selectedIndex = $(event.target).attr("data-order"),
                    mapping = this.data.sync.mappings[selectedIndex],
                    recon = null;

                if (mapping.recon) {
                    recon = mapping.recon;

                    recon.convertedTime = DateUtil.formatDate(recon.ended,"MMMM dd, yyyy HH:mm");
                    recon.convertedDuration = moment.utc(recon.duration).format("HH:mm:ss:SSS");
                }

                this.$el.find(".recon-widget-header .title").popover("destroy");

                this.reconResultRender(mapping, recon);
            }
        });

    widgetInstance.generateWidget = function(loadingObject, callback) {
        var widget = {},
            loadingWidget = loadingObject.widget;

        $.extend(true, widget, new Widget());

        // The boolean value of `false` will cause an error for settings so convert to string
        if (loadingObject.widget.barchart) {
            loadingObject.widget.barchart = loadingObject.widget.barchart.toString();
        } else {
            loadingObject.widget.barchart = "false";
        }

        widget.render(loadingObject, callback);

        return widget;
    };

    return widgetInstance;
});
