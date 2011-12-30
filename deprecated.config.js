/*
 * Configuration. These determine both which failing tests to list
 * and which branches and environments to show in the history for each failing test.
 */
var branches = ["RELENG-10-3-DR4", "RELENG-10-3-DR5"];
var fetch_tickets = true;

var environments = {
    "RELENG-10-3-DR4": ["DEPRECATED-jboss+mysql", "DEPRECATED-jboss+tomcat+mysql"],
    "RELENG-10-3-DR5": ["DEPRECATED-jboss+mysql", "DEPRECATED-jboss5+tomcat+mysql", "DEPRECATED-jboss+tomcat+mysql"]
}

var DAYS=30;
//var TRIGGER_DAYS=14;
