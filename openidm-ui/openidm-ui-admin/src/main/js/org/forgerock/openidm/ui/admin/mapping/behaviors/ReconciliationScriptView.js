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
    "org/forgerock/openidm/ui/admin/mapping/util/MappingScriptsView"
], function($, _,
        MappingScriptsView) {
    var ReconciliationScriptView = MappingScriptsView.extend({
        element: "#reconQueryView",
        noBaseTemplate: true,
        events: {
            "click .addScript": "addScript",
            "click .saveScripts": "saveScripts"
        },
        model: {
            scripts: ["result"],
            scriptEditors: {},
            successMessage: "triggeredByReconSaveSuccess"
        },

        render: function() {
            this.parentRender(function () {
                this.init();

                //Needs to be out of scope since this dom element isn't in the $el and we need access to the script widget
                $("#reconQueryViewBody").on("shown.bs.collapse", _.bind(function() {
                    this.model.scriptEditors.result.refresh();
                }, this));
            });
        }
    });

    return new ReconciliationScriptView();
});