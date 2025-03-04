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
    "bootstrap",
    "org/forgerock/openidm/ui/common/dashboard/widgets/AbstractWidget"
], function($, _, bootstrap,
        AbstractWidget) {
    var widgetInstance = {},
        Widget = AbstractWidget.extend({
            template: "templates/admin/dashboard/widgets/FrameWidgetTemplate.html",
            model : {
                "overrideTemplate" : "dashboard/widget/_frameConfig"
            },

            widgetRender: function(args, callback) {
                this.data.height = args.widget.height;
                this.data.width = args.widget.width;
                this.data.frameUrl = args.widget.frameUrl;

                this.partials.push("partials/dashboard/widget/_frameConfig.html");

                this.parentRender(_.bind(function(){
                    this.$el.parent().find(".widget-section-title .widget-title").text(args.widget.title);

                    if (callback) {
                        callback();
                    }
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
