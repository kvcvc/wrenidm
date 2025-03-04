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
 * Copyright 2016 ForgeRock AS.
 */

define([
    "jquery",
    "underscore",
    "dimple",
    "org/forgerock/openidm/ui/common/dashboard/widgets/AbstractWidget",
    "org/forgerock/commons/ui/common/main/EventManager",
    "org/forgerock/commons/ui/common/util/Constants",
    "org/forgerock/commons/ui/common/main/Configuration",
    "org/forgerock/openidm/ui/common/delegates/SystemHealthDelegate"
], function($, _,
        dimple,
        AbstractWidget,
        eventManager,
        constants,
        conf,
        SystemHealthDelegate) {
    var widgetInstance = {},
        Widget = AbstractWidget.extend({
            template : "templates/dashboard/widget/DashboardSingleWidgetTemplate.html",
            model: {
                heapChart: null,
                nonHeapChart: null,
                chartX: 0,
                chartY: 0,
                chartWidth: "100%",
                chartHeight: 180,
                drawTime: 1000,
                canvasWidth: "100%",
                canvasHeight: 190,
                warningThreshold: "60",
                warningChartColor: "#f0ad4e",
                dangerThreshold: "85",
                dangerChartColor: "#a94442",
                defaultChartColor: "#519387"
            },

            drawChart: function(svg, data, percent) {
                var ring,
                    color = this.model.defaultChartColor,
                    percentClass = "text-primary";

                if (percent !== "N/A") {
                    if (percent > this.model.dangerThreshold) {
                        color =  this.model.dangerChartColor;
                        percentClass = "danger";
                    } else if (percent > this.model.warningThreshold) {
                        color =  this.model.warningChartColor;
                        percentClass = "warning";
                    }

                    percent = percent + "%";
                }

                //widget-header
                this.$el.find(".widget-header").toggleClass("donut-header", true);
                this.$el.find(".widget-header").html('<div class="header">' +$.t("dashboard.used") +'</div>'
                    + '<div class="percent ' +percentClass +'">' +percent  +'</div>');

                this.model.chart =  new dimple.chart(svg, data);
                this.model.chart.setBounds(this.model.chartX, this.model.chartY, this.model.chartWidth, this.model.chartHeight);
                this.model.chart.addMeasureAxis("p", "memory");

                this.model.chart.assignColor("Free", "#dddddd", "#f7f7f7");
                this.model.chart.assignColor("Used", color, "#f7f7f7");
                this.model.chart.assignClass("Used", "used-memory");

                ring = this.model.chart.addSeries("type", dimple.plot.pie);
                ring.innerRadius = "85%";
                ring.addOrderRule("type", true);
                ring.addEventHandler("mouseover", _.noop);

                this.model.chart.draw();
            },

            widgetRender: function(args, callback) {
                this.model.currentData = [];

                this.events["click .refresh-health-info"] = "refresh";

                if (args.widget.simpleWidget) {
                    this.data.simpleWidget = true;
                } else {
                    this.data.simpleWidget = false;
                }

                this.data.menuItems = [{
                    "icon" : "fa-refresh",
                    "menuClass" : "refresh-health-info",
                    "title" : "Refresh"
                }];

                if (this.data.widgetType === "lifeCycleMemoryHeap") {
                    this.data.widgetTextDetails = $.t("dashboard.memoryUsageHeap");
                } else if (this.data.widgetType === "lifeCycleMemoryNonHeap") {
                    this.data.widgetTextDetails = $.t("dashboard.memoryUsageNonHeap");
                }

                $(window).unbind("resize." +this.data.widgetType);

                this.parentRender(_.bind(function() {
                    SystemHealthDelegate.getMemoryHealth().then(_.bind(function (widgetData) {
                        var svg = [],
                            data,
                            percent;

                        if (this.data.widgetType === "lifeCycleMemoryHeap") {
                            widgetData = widgetData.heapMemoryUsage;
                        } else {
                            widgetData = widgetData.nonHeapMemoryUsage;
                        }

                        this.$el.find(".dashboard-details").show();

                        svg.push(dimple.newSvg(this.$el.find(".widget-chart")[0], this.model.canvasWidth, this.model.canvasHeight));

                        if (widgetData.max === -1) {
                            percent = "N/A";

                            data = [
                                {
                                    "memory": 0,
                                    "type": "Used"
                                },
                                {
                                    "memory": 1,
                                    "type": "Free"
                                }
                            ];
                        } else {
                            percent = Math.round((widgetData.used / widgetData.max) * 100);

                            data = [
                                {
                                    "memory": widgetData.used,
                                    "type": "Used"
                                },
                                {
                                    "memory": widgetData.max - widgetData.used,
                                    "type": "Free"
                                }
                            ];
                        }

                        this.drawChart(svg[0], data, percent);

                        this.$el.find(".widget-header").show();

                        if (callback) {
                            callback();
                        }
                    }, this));
                }, this));
            },

            resize: function() {
                if (this.model.chart) {
                    this.model.chart.draw(0, true);
                }
            },

            refresh: function(event) {
                if (event) {
                    event.preventDefault();
                }

                SystemHealthDelegate.getMemoryHealth().then(_.bind(function(widgetData) {
                    var percent,
                        usedCpu = this.$el.find(".used-memory");

                    if (this.data.widgetType === "lifeCycleMemoryHeap") {
                        widgetData = widgetData.heapMemoryUsage;
                    } else {
                        widgetData = widgetData.nonHeapMemoryUsage;
                    }

                    if (widgetData.max === -1) {
                        percent = "N/A";

                        this.model.chart.data = [
                            {
                                "memory": 0,
                                "type": "Used"
                            },
                            {
                                "memory":1,
                                "type": "Free"
                            }
                        ];

                        this.$el.find(".percent").html(percent);
                    } else {
                        percent = Math.round((widgetData.used / widgetData.max) * 100);

                        this.model.chart.data = [
                            {
                                "memory": widgetData.used,
                                "type": "Used"
                            },
                            {
                                "memory": widgetData.max - widgetData.used,
                                "type": "Free"
                            }
                        ];


                        this.$el.find(".percent").html(percent + "%");
                        this.$el.find(".percent").toggleClass("danger", false);
                        this.$el.find(".percent").toggleClass("warning", false);

                        if (percent > this.model.dangerThreshold) {
                            usedCpu.attr("fill", this.model.dangerChartColor);
                            usedCpu.css("fill", this.model.dangerChartColor);

                            this.$el.find(".percent").toggleClass("danger", true);
                        } else if (percent > this.model.warningThreshold) {
                            usedCpu.attr("fill", this.model.warningChartColor);
                            usedCpu.css("fill", this.model.warningChartColor);

                            this.$el.find(".percent").toggleClass("warning", true);
                        } else {
                            usedCpu.attr("fill", this.model.defaultChartColor);
                            usedCpu.css("fill", this.model.defaultChartColor);

                            this.$el.find(".percent").toggleClass("text-primary", true);
                        }

                    }

                    this.model.chart.draw(1000);
                }, this));
            }
        });

    widgetInstance.generateWidget = function(loadingObject, callback) {
        var widget = {};

        $.extend(true, widget, new Widget());

        widget.render(loadingObject, callback);

        return widget;
    };

    return widgetInstance;
});