/*
 * Configuration. These determine both which failing tests to list
 * and which branches and environments to show in the history for each failing test.
 */
var branches = ["RELENG-10-3-DR5", "RELENG-10-3-DR6"];
var fetch_tickets = true

var environments = {
    "RELENG-10-3-DR5": ["SYSTEM-embedded+derby",
                        "SYSTEM-jboss+mysql",
                        "SYSTEM-jboss5+tomcat+mysql",
                        "SYSTEM-jboss+oracle",
                        "SYSTEM-websphere+oracle",
                        "SYSTEM-multimachine-jboss+mysql",
                        "SYSTEM-jboss+sqlserver",
                        "LONG-jboss+mysql",
                        "LONG-jboss5+tomcat+mysql",
                        "LONG-jboss+oracle",
                        "LONG-jboss+sqlserver",
                        "LONG-websphere+oracle",
                        "SYSTEM-upgrade-pear-jboss+mysql",
                        "SYSTEM-upgrade-pear-jboss5+tomcat+mysql",
                        "SYSTEM-upgrade-pear-jboss+oracle",
                        "SYSTEM-upgrade-pear-websphere+oracle",
                        "BENCHMARK-jboss+tomcat+mysql",
                        "BENCHMARK-jboss5+tomcat+mysql",
                        "BENCHMARK-jboss+tomcat+sqlserver",
                        "BENCHMARK-plugins-jboss+tomcat+mysql",
                        "BENCHMARK-plugins-jboss5+tomcat+mysql",
                        "BENCHMARK-tablet-plugins-jboss+tomcat+mysql",
                        "WEBAPPS-jboss5+tomcat+mysql",
                        "WEBAPPS-jboss+tomcat+mysql",
                        "WEBAPPS-websphere+oracle",
                        "WEBAPPS-plugins-websphere+oracle",
                        "WEBAPPS-plugins-jboss+tomcat+mysql",
                        "WEBAPPS-plugins-jboss5+tomcat+mysql",
                        "WEBAPPS-jboss+tomcat+sqlserver",
                        "WEBAPPS-embedded+derby",
                        "TABLET-tablet-plugins-jboss+tomcat+mysql",
                        "TABLET-tablet-plugins-websphere+oracle",
                        "PLUGINS-tablet-plugins-jboss+tomcat+mysql",
                        "PLUGINS-plugins-jboss5+tomcat+mysql",
                        "WEBAPPS-tablet-plugins-jboss+tomcat+mysql",
                        "WEBAPPS-tablet-plugins-websphere+oracle",
                        "OVCMS-ovcms-jboss+tomcat+mysql",
                        "WEBAPPS-ovcms-jboss+tomcat+mysql",
                        "BENCHMARK-ovcms-jboss+tomcat+mysql"],
    "RELENG-10-3-DR6": ["SYSTEM-embedded+derby",
                        "SYSTEM-jboss+mysql",
                        "SYSTEM-jboss5+tomcat+mysql",
                        "SYSTEM-jboss+oracle",
                        "SYSTEM-websphere+oracle",
                        "SYSTEM-multimachine-jboss+mysql",
                        "SYSTEM-jboss+sqlserver",
                        "LONG-jboss+mysql",
                        "LONG-jboss5+tomcat+mysql",
                        "LONG-jboss+oracle",
                        "LONG-jboss+sqlserver",
                        "LONG-websphere+oracle",
                        "SYSTEM-upgrade-pear-jboss+mysql",
                        "SYSTEM-upgrade-pear-jboss5+tomcat+mysql",
                        "SYSTEM-upgrade-pear-jboss+oracle",
                        "SYSTEM-upgrade-pear-websphere+oracle",
                        "BENCHMARK-jboss+tomcat+mysql",
                        "BENCHMARK-jboss5+tomcat+mysql",
                        "BENCHMARK-jboss+tomcat+sqlserver",
                        "BENCHMARK-plugins-jboss+tomcat+mysql",
                        "BENCHMARK-plugins-jboss5+tomcat+mysql",
                        "BENCHMARK-tablet-plugins-jboss+tomcat+mysql",                        
                        "WEBAPPS-jboss5+tomcat+mysql",
			"WEBAPPS-jboss5+tomcat+oracle",
                        "WEBAPPS-jboss+tomcat+mysql",
                        "WEBAPPS-websphere+oracle",
                        "WEBAPPS-plugins-websphere+oracle",
                        "WEBAPPS-plugins-jboss+tomcat+mysql",
                        "WEBAPPS-plugins-jboss5+tomcat+mysql",
                        "WEBAPPS-jboss+tomcat+sqlserver",
                        "WEBAPPS-embedded+derby",
                        "TABLET-tablet-plugins-jboss+tomcat+mysql",
                        "TABLET-tablet-plugins-websphere+oracle",
                        "PLUGINS-tablet-plugins-jboss+tomcat+mysql",
                        "PLUGINS-plugins-jboss5+tomcat+mysql",
                        "WEBAPPS-tablet-plugins-jboss+tomcat+mysql",
                        "WEBAPPS-tablet-plugins-websphere+oracle",
                        "OVCMS-ovcms-jboss+tomcat+mysql",
                        "WEBAPPS-ovcms-jboss+tomcat+mysql",
                        "BENCHMARK-ovcms-jboss+tomcat+mysql"]
}

var DAYS=30;
