/*
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
 * Copyright 2013 ForgeRock Inc.
 */

package org.forgerock.openidm.jaspi.config;

import org.apache.felix.scr.annotations.Activate;
import org.apache.felix.scr.annotations.Component;
import org.apache.felix.scr.annotations.ConfigurationPolicy;
import org.apache.felix.scr.annotations.Deactivate;
import org.apache.felix.scr.annotations.Service;
import org.forgerock.json.fluent.JsonValue;
import org.forgerock.openidm.config.JSONEnhancedConfig;
import org.osgi.framework.Constants;
import org.osgi.service.component.ComponentContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(name = AuthenticationConfigImpl.PID, policy = ConfigurationPolicy.REQUIRE)
@Service
public class AuthenticationConfigImpl implements AuthenticationConfig {

    public static final String PID = "org.forgerock.openidm.authentication";

    private static final Logger DEBUG = LoggerFactory.getLogger(AuthenticationConfigImpl.class);

    private JsonValue config;

    @Override
    public JsonValue getConfig() {
        return config;
    }

    @Activate
    public void activate(ComponentContext context) {
        config = JSONEnhancedConfig.newInstance().getConfigurationAsJson(context);
        DEBUG.debug("OpenIDM Config for Authentication {} is activated.", config.get(Constants.SERVICE_PID));
    }

    @Deactivate
    public void deactivate(ComponentContext context) {
        DEBUG.debug("OpenIDM Config for Authentication {} is deactivated.", config.get(Constants.SERVICE_PID));
        config = null;
    }
}
