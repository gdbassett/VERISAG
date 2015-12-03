/*
 AUTHOR: Gabriel Bassett
 DATE: 04-27-2015
 DEPENDENCIES: TBD
 Copyright 2015 Gabriel Bassett

 LICENSE:
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
'''

 DESCRIPTION:
 TDB

*/

var graphInstance;

$(document).ready(function() {
    var all_paths;
    // instantiate the sigma instance so we can reference it
    //var s = new sigma('sigmajs_container');

    sigma.parsers.gexf(
        './static/all.gexf',
        {   // Here is the ID of the DOM element that
            // will contain the graph:
            container: 'sigmajs_container'
        },
        function(s) {
            // This function will be executed when the
            // graph is displayed, with "s" the related
            // sigma instance.
            // Store the original colors for use later
            s.graph.nodes().forEach(function(n) {
            n.originalColor = n.color;
            });
            s.graph.edges().forEach(function(e) {
            e.originalColor = e.color;
            });

            // Store the graph to a global variable
            graphInstance = s;
        }
    );

    // Draw a bar chart of all potential paths
    // http://nvd3.org/examples/multiBarHorizontal.html
    var wo_mitigation = {"key": "Without Mitigation",
                        "color": "#3b1f02",
                        "values": []
    }; 
    // Get the values from the initial graph
    var o = {
        "worry": "all"
    };
    // request the paths
    $.ajax({
        type: "GET",
        url: "/paths/",
        contentType: "application/json; charset=utf-8",
        data: o,
        traditional:true,
        success: function(data) {
            // Debug
//            console.log(data)

            // format chart data
            all_paths = format_chart_data(data);
            wo_mitigation["values"] = all_paths;

            if ($("#show_zero_len_paths").val() != "TRUE") {
                wo_mitigation["values"] = filter_zero_len_paths(wo_mitigation["values"]);
            };

            // Build the bar chart of paths with the paths
            $('#chart1 svg').empty();
            nv.addGraph(function() {
                var chart = nv.models.multiBarHorizontalChart()
                    .x(function(d) { return d.label })
                    .y(function(d) { return d.value })
                    .margin({top: 30, right: 20, bottom: 50, left: 20})  // left changed from 175
                    .showValues(true)           //Show bar value next to each bar.
                    .tooltips(true)             //Show tooltips on hover.
//                    .duration(350)
                    .showControls(false);        //Allow user to switch between "Grouped" and "Stacked" mode.

                chart.showXAxis(false)
                chart.yAxis
                    .tickFormat(d3.format(',.2f'));

                d3.select('#chart1 svg')
                    .datum([wo_mitigation])
                    .call(chart);

                nv.utils.windowResize(chart.update);

                return chart;
            });
        },
        error: function(jqXHR, textStatus, errorThrown) {
            //alert(jqXHR.responseText);
            alert(errorThrown);
        }
    });


    // When worries is changed
    $("#worries").change(function () {
        // Clear the analysis
        $('#output').empty();
        $('#output').append("Please click the 'analyze' button to analyze the graph.");

        // Update the graph
        $('#sigmajs_container').empty();
        var end = this.value;
        // Clear the all actors analysis
        $('#output').empty();
        $('#output').append("Please click the 'analyze' button to analyze the graph.");

//        console.log('./static/' + end + '.gexf');
        sigma.parsers.gexf(
            './static/' + end + '.gexf',
            {   // Here is the ID of the DOM element that
                // will contain the graph:
                container: 'sigmajs_container'
            },
            function(s) {
                // This function will be executed when the
                // graph is displayed, with "s" the related
                // sigma instance.
                // Store the original colors for use later
                s.graph.nodes().forEach(function(n) {
                n.originalColor = n.color;
                });
                s.graph.edges().forEach(function(e) {
                e.originalColor = e.color;
                });

                // Store the graph to a global variable
                graphInstance = s;
            }
        );

        // Update bar chart of potential attack paths
        // Set the data to send
        var o = {
            "worry": $('#worries').val()
        };
        // request the paths
        $.ajax({
            type: "GET",
            url: "/paths/",
            contentType: "application/json; charset=utf-8",
            data: o,
            traditional:true,
            success: function(data) {
                // Debug
//                console.log(data);

                // format chart data
                all_paths = format_chart_data(data);
                wo_mitigation["values"] = all_paths;

                // Filter the path by selected attributes
                var selected_attributes = get_attributes($("#attributes").val());

                if ($.inArray("Everything", selected_attributes) == -1) {
                    var wo_values_2 = [];
                    for (var i = 0; i < all_paths.length; i++) {
                        // get the destination
                        var dst = all_paths[i]['label'].split("->",2);
                        //console.log(dst[1]);
                        // if the destination is in our attribute list, add it to the new values
                        if ($.inArray(dst[1], selected_attributes) != -1) {
                            wo_values_2.push(all_paths[i]);
                        }
                    }
                    wo_mitigation["values"] = wo_values_2;
                };

                // Filter zero length paths
                if ($("#show_zero_len_paths").val() != "TRUE") {
                    wo_mitigation["values"] = filter_zero_len_paths(wo_mitigation["values"]);
                };

                // Build the bar chart of paths with the paths
                $('#chart1 svg').empty();
                nv.addGraph(function() {
                    var chart = nv.models.multiBarHorizontalChart()
                        .x(function(d) { return d.label })
                        .y(function(d) { return d.value })
                        .margin({top: 30, right: 20, bottom: 50, left: 20})  // left changed from 175
                        .showValues(true)           //Show bar value next to each bar.
                        .tooltips(true)             //Show tooltips on hover.
//                        .duration(350)
                        .showControls(false);        //Allow user to switch between "Grouped" and "Stacked" mode.

                    chart.showXAxis(false)
                    chart.yAxis
                        .tickFormat(d3.format(',.2f'));

                    d3.select('#chart1 svg')
                        .datum([wo_mitigation])
                        .call(chart);

                    nv.utils.windowResize(chart.update);

                    return chart;
                });
            },
            error: function(jqXHR, textStatus, errorThrown) {
                //alert(jqXHR.responseText);
                alert(errorThrown);
            }
        });

        // Clear the likely actor outputs
        $('#likely_actor_analyze').empty();
        $('#likely_actor_analyze').append("Please click the 'analyze' button to analyze the graph.");
        $('#chart2 svg').empty();
        $('#chart2 p').empty();
        $('#chart3 svg').empty();
        $('#chart3 p').empty();

    });


    // When Protect is changed
    $("#attributes").change(function() {
        // Clear the all actors analysis
        $('#output').empty();
        $('#output').append("Please click the 'analyze' button to analyze the graph.");

        // Get the attributes
        var selected_attributes = get_attributes($("#attributes").val());

        //console.log(selected_attributes);

        // Grey out attribute->end edges that aren't selected attributes
        ////////////////////////
        var s = graphInstance;
        if ($.inArray("Everything", selected_attributes) == -1) {
            var end_node;
            // Get the end attribute.  (There has to be a better way than this)
            s.graph.nodes().forEach(function(n) {
                if (n.label == "end") {
                    end_node = n.id
                };
            });
            // Set all nodes to grey
            var nodes_to_grey = [];
            s.graph.nodes().forEach(function(n) {
              if (/^attribute./.test(n.label) & ($.inArray(n.label, selected_attributes) == -1)) {
                nodes_to_grey.push(n.id)
              }
            });
            s.graph.edges().forEach(function(e) {
              if (($.inArray(e.source, nodes_to_grey) != -1) & (e.target == end_node)) {
                e.color = '#eee';
              } else {
                e.color = e.originalColor;
              }
            });
            s.refresh();
        } else {
            s.graph.edges().forEach(function(e) {
                e.color = e.originalColor;
            });
            s.refresh();
        }

        // Update bar chart of potential attack paths
        //////////////////
        if ($.inArray("Everything", selected_attributes) == -1) {
            var wo_values_2 = [];
            for (var i = 0; i < all_paths.length; i++) {
                // get the destination
                var dst = all_paths[i]['label'].split("->",2);
                //console.log(dst[1]);
                // if the destination is in our attribute list, add it to the new values
                if ($.inArray(dst[1], selected_attributes) != -1) {
                    wo_values_2.push(all_paths[i]);
                }
            }
            wo_mitigation["values"] = wo_values_2;
        } else {
            wo_mitigation["values"] = all_paths;
        }

        // Filter zero length paths
        if ($("#show_zero_len_paths").val() != "TRUE") {
            wo_mitigation["values"] = filter_zero_len_paths(wo_mitigation["values"]);
        };

        //console.log(wo_mitigation)

        $('#chart1 svg').empty();
        nv.addGraph(function() {
            var chart = nv.models.multiBarHorizontalChart()
                .x(function(d) { return d.label })
                .y(function(d) { return d.value })
                .margin({top: 30, right: 20, bottom: 50, left: 20})  // left changed from 175
                .showValues(true)           //Show bar value next to each bar.
                .tooltips(true)             //Show tooltips on hover.
//                        .duration(350)
                .showControls(false);        //Allow user to switch between "Grouped" and "Stacked" mode.

            chart.showXAxis(false)
            chart.yAxis
                .tickFormat(d3.format(',.2f'));

            d3.select('#chart1 svg')
                .datum([wo_mitigation])
                .call(chart);

            nv.utils.windowResize(chart.update);

            return chart;
        });

        // Clear the likely actor outputs
        $('#likely_actor_analyze').empty();
        $('#likely_actor_analyze').append("Please click the 'analyze' button to analyze the graph.");
        $('#chart2 svg').empty();
        $('#chart2 p').empty();
        $('#chart3 svg').empty();
        $('#chart3 p').empty();

    });

    // Allow the tabs to hide and unhide stuff
    $("#all_actors_tab").click(function() {
        $("#all_actors_output_div").show();
        $("#likely_actor_output_div").hide();
        $("#comparative_output_div").hide();
        $('#chart1 svg').trigger('resize');
        $('#attributes').attr('readonly', false);
        $('#attributes').css('background-color', '#FFFFFF');
    })

    $("#likely_actor_tab").click(function() {
        $("#all_actors_output_div").hide();
        $("#likely_actor_output_div").show();
        $("#comparative_output_div").hide();
        $('#chart2 svg').trigger('resize');
        $('#chart3 svg').trigger('resize');
        $('#attributes').attr('readonly', false);
        $('#attributes').css('background-color', '#FFFFFF');
    })

    $("#comparative_tab").click(function() {
        $("#all_actors_output_div").hide();
        $("#likely_actor_output_div").hide();
        $("#comparative_output_div").show();
        $('#attributes').attr('readonly', true);
        $('#attributes').css('background-color', '#CCCCCC');
    })


//    multibar.dispatch.on('elementMouseover.tooltip') {
//        $.noop();
//    };

    // THis runs all actors analysis if the tab is visible
    $("#analyze_button").click(function() {
        if ($("#all_actors_output_div").is(":visible")) {
            // DEBUG
    //        console.log($('#attributes').val())
            var o = {
                "worry": $('#worries').val(),
                "attributes": $('#attributes').val()
            };

            // Test if there is an overlap in the attributes and the graph
            var nodes = []
            var s = graphInstance;
            s.graph.nodes().forEach(function(n) {
                nodes.push(n.label)
            });
            var attributes = get_attributes($("#attributes").val());
            // http://documentcloud.github.io/underscore/
            var overlap = _.intersection(nodes, attributes);
            var everything = $.inArray("Everything", attributes);

            // if an unacceptable worry is indicated, remove it
            if (o['worry'] ==  "-") {
                alert("The 'worry' choise is invalid.  please select 'everything' or a valid worry.")
            } else if ((overlap.length) <= 0 & (everything == -1)) {
                alert("The attribute(s) you chose to protect do not exist in the graph from your 'worry' choice.  Please update your choices and analyze again.")
            } else {


                $('#output').empty();
                $('#output').append("Analysis beginning.  This may take a few seconds up to 15 minutes if the requested attack graph is not cached.");

                $.ajax({
                    type: "GET",
                    url: "/analyze/",
                    contentType: "application/json; charset=utf-8",
                    data: o,
                    traditional:true,
                    success: function(data) {
                        // Debug
                        //alert(data.controls + data.removed_paths + data.dist_increase)
                        var controls = "";
                        $('#output').empty();
                        if (data.error != "") {
                            $('#output').append("Error: " + data.error)
                        } else if (data.controls == null) {
                            $('#output').append("No path exists from any action to the selected attributes to protect, so no mitigation is necessary.")
                        } else {
                            $('#output').append("Mitigate " + data.controls +
                             " to eliminate " + data.removed_paths +
                             "% of attack paths and improve defenses on remaining paths by " + data.dist_increase + "%."
                            );
                        };

                        // DEBUG
    //                  console.log(data.path_lengths)

                        // Augment the bar chart of paths with the longer paths
                        // get the mitigated path data
                        var w_mitigation = {"key": "With Mitigation",
                                            "color": "#8F1706",
                                            "values": []
                        };
                        w_mitigation["values"] = format_chart_data(data.path_lengths);

                        // Filter zero length paths
                        if ($("#show_zero_len_paths").val() != "TRUE") {
                            wo_mitigation["values"] = filter_zero_len_paths(wo_mitigation["values"]);
                        };

                        // Filter by selected attributes
                        // unnecessary as the analysis algorithms already do this
                        /*
                        var selected_attributes = get_attributes(o["attributes"]);
                        if ($.inArray("Everything", selected_attributes) == -1) {
                            var wo_values_2 = [];
                            var w_values_2 = [];
                            for (var i = 0; i < wo_mitigation["values"].length; i++) {
                                // get the destination
                                var dst = wo_mitigation["values"][i]['label'].split("->",2);
                                //console.log(dst[1]);
                                // if the destination is in our attribute list, add it to the new values
                                if ($.inArray(dst[1], selected_attributes) != -1) {
                                    wo_values_2.push(wo_mitigation["values"][i]);
                                    w_values_2.push(w_mitigation["values"][i]);
                                }
                            }
                            wo_mitigation["values"] = wo_values_2;
                            w_mitigation["values"] = w_values_2;
                        }
                        */

                        // Filter values not in without mitigation from with mitigation
                        var wo_mitigation_values = [];
                        for (var i = 0; i < wo_mitigation["values"].length; i++) {
                            wo_mitigation_values.push(wo_mitigation["values"][i]["label"]);
                        };
                        var w_values_2 = [];
                        for (var i = 0; i < w_mitigation["values"].length; i++) {
                            if ($.inArray(w_mitigation["values"][i]["label"], wo_mitigation_values) != -1) {
                                w_values_2.push(w_mitigation["values"][i]);
                            }
                        };
                        w_mitigation["values"] = w_values_2;

                        // build chart
                        $('#chart1 svg').empty();
                        nv.addGraph(function() {
                            var chart = nv.models.multiBarHorizontalChart()
                                .x(function(d) { return d.label })
                                .y(function(d) { return d.value })
                                .margin({top: 30, right: 20, bottom: 50, left: 20})  // left changed from 175
                                .showValues(true)           //Show bar value next to each bar.
                                .tooltips(true)             //Show tooltips on hover.
    //                            .duration(350)
                                .showControls(false);        //Allow user to switch between "Grouped" and "Stacked" mode.

                            chart.showXAxis(false)
                            chart.yAxis
                                .tickFormat(d3.format(',.2f'));

                            d3.select('#chart1 svg')
                                .datum([wo_mitigation, w_mitigation])
                                .call(chart);

                            nv.utils.windowResize(chart.update);

                            return chart;
                        });
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        //alert(jqXHR.responseText);
                        alert(errorThrown);
                    }

                });
            };
        };
    });

    // This runs likely actor analysis if the tab is visible
    $("#analyze_button").click(function() {
        if ($("#likely_actor_output_div").is(":visible")) {
            // DEBUG
            //  console.log($('#attributes').val())
            var o = {
                "worry": $('#worries').val(),
                "attributes": $('#attributes').val()
            };

            // Test if there is an overlap in the attributes and the graph
            var nodes = []
            var s = graphInstance;
            s.graph.nodes().forEach(function(n) {
                nodes.push(n.label)
            });
            var attributes = get_attributes($("#attributes").val());
            // http://documentcloud.github.io/underscore/
            var overlap = _.intersection(nodes, attributes);
            var everything = $.inArray("Everything", attributes);

            // if an unacceptable worry is indicated, remove it
            if (o['worry'] ==  "-") {
                alert("The 'worry' choise is invalid.  please select 'everything' or a valid worry.")
            } else if ((overlap.length) <= 0 & (everything == -1)) {
                alert("The attribute(s) you chose to protect do not exist in the graph from your 'worry' choice.  Please update your choices and analyze again.")
            } else {
                $('#likely_actor_analyze').empty();
                $('#likely_actor_analyze').append("Analysis beginning.  This analysis loops and may take 30 seconds or more.");
                $('#chart2 svg').empty();
                $('#chart2 p').empty();
                $('#chart3 svg').empty();
                $('#chart3 p').empty();

                $.ajax({
                    type: "GET",
                    url: "/analyze_likely_actor/",
                    contentType: "application/json; charset=utf-8",
                    data: o,
                    traditional:true,
                    success: function(data) {
                        console.log(data);  // DEBUG

                        // Fill in the table with mitigations and relative improvement


                        // Fill in Chart 2 (mitigations)
                        myData = data.likely_actor.chart;
                        $('#chart2 svg').empty();

                        nv.addGraph(function() {
                          var chart = nv.models.scatterChart()
                                        .showDistX(true)    //showDist, when true, will display those little distribution lines on the axis.
                                        .showDistY(true)
                                        .yDomain([myData.values[myData.values.length - 1].y, 0])
                                        .color(d3.scale.category10().range());
                          //Configure how the tooltip looks.
                          chart.tooltipContent(function(key, x, y, e, graph) {
                            var s = "unknown";
                //            console.log(graph);
                            var pt = getGraphtPt(graph, x, y);
                            if (pt !== null) {
                                s = pt["name"];
                            }
                              return '<h3>' + key + ": " + s + '</h3>';
                          });
                          //Axis settings
                          chart.xAxis.tickFormat(d3.format('d'));
                          chart.yAxis.tickFormat(d3.format(',%'));
                          //Axis Label
                          chart.yAxis.axisLabel('Improvement Over No Mitigation');
                          chart.xAxis.axisLabel('Mitigation Number');
                //          console.log(myData)  // DEBUG
                          d3.select('#chart2 svg')
                              .datum([myData])
                              .call(chart);
                          nv.utils.windowResize(chart.update);
                          return chart;
                        });

                        $('#chart2 p').empty();
                        $('#chart2 p').append("This figure shows the best mitigation to take to stop the most likely actor \
                                               and the relative improvement over no mitigation at all.");

                        // Fill Chart 3 (paths)
                        var myData_chart3 = {"key": "With Cumulative Mitigation",
                                            "color": "#3b1f02",
                                            "values": []
                        };
                        myData_chart3["values"] = format_chart_data(data.likely_actor.shortest_paths);

                        $('#chart3 svg').empty();
                        nv.addGraph(function() {
                            var chart = nv.models.multiBarHorizontalChart()
                                .x(function(d) { return d.label })
                                .y(function(d) { return d.value })
                                .margin({top: 30, right: 20, bottom: 50, left: 20})  // left changed from 175
                                .showValues(true)           //Show bar value next to each bar.
                                .tooltips(true)             //Show tooltips on hover.
    //                            .duration(350)
                                .showControls(false);        //Allow user to switch between "Grouped" and "Stacked" mode.

                            chart.showXAxis(false)
                            chart.yAxis
                                .tickFormat(d3.format(',.2f'));

                            d3.select('#chart3 svg')
                                .datum([myData_chart3])
                                .call(chart);

                            nv.utils.windowResize(chart.update);

                            return chart;
                        });
                        $('#chart3 p').empty();
                        $('#chart3 p').append("This figure shows the shortest path before each mitigation.");


                        // Fill in last mitigation
                        $('#likely_actor_last_mitigation p').empty();
                        $('#likely_actor_last_mitigation p').append("After all other mitigations, mitigating <b>" + data.likely_actor.last_mitigation + "</b> removes all remaining attack paths.");

                        // Return analysis statement to original text
                        $('#likely_actor_analyze').empty();
                        $('#likely_actor_analyze').append("The best mitigation to address the most likely actor is <b>" + myData.values[1].name + "</b> for an improvement of <b>" + Math.round(myData.values[1].y * 100) + "%</b> over no mitigation.");
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        //alert(jqXHR.responseText);
                        alert(errorThrown);
                    }
                });
            }
        }
    });

    // THis runs all actors analysis if the tab is visible
    $("#analyze_button").click(function() {
        if ($("#comparative_output_div").is(":visible")) {
            // DEBUG
    //        console.log($('#attributes').val())
            var o = {
                "worry": $('#worries').val(),
                "mitigations1": $('#mitigations1').val(),
                "mitigations2": $('#mitigations2').val()
            };

            if (o['worry'] ==  "-") {
                alert("The 'worry' choise is invalid.  please select 'everything' or a valid worry.");
            } else {
                $.ajax({
                    type: "GET",
                    url: "/analyze_comparison/",
                    contentType: "application/json; charset=utf-8",
                    data: o,
                    traditional:true,
                    success: function(data) {
                        console.log(data);  // DEBUG

                        STUFF GOES HERE
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        //alert(jqXHR.responseText);
                        alert(errorThrown);
                    }
                });
            };
        };
    });

    function getGraphtPt(graph, x1, y1) {
            var a = graph.series.values;
            var i = a.length;
         while (i--) {
//           if (a[i].x==x1 & a[i].y==y1) {
           if (a[i].x==x1) { // replace above line because y is too accurate & only 1 point per x.
              return a[i];
          }
       }
       return null;
    }


    function filter_zero_len_paths(p) {
        var new_paths = [];
        for (var i = 0; i < p.length; i++) {
            if (p[i]['value'] != 0) {
                new_paths.push(p[i]);
            };
        };
        return new_paths;
    }


    function get_attributes(attributes) {
        // Take a string from the properties window and return the associated attributes
        var selected_attributes = [];
        for (var i = 0; i < attributes.length; i++) {
            if (attributes[i] == "-") {
                $.noop
            } else if (attributes[i] == "Availability") {
                selected_attributes = selected_attributes.concat([
                    "attribute.availability.variety.Destruction",
                    "attribute.availability.variety.Loss",
                    "attribute.availability.variety.Interruption",
                    "attribute.availability.variety.Degradation",
                    "attribute.availability.variety.Acceleration",
                    "attribute.availability.variety.Obscuration",
                    "attribute.availability.variety.Other"
                ]);
            } else if (attributes[i] == "Confidentiality") {
                selected_attributes = selected_attributes.concat([
                    "attribute.confidentiality.data.variety.Credentials",
                    "attribute.confidentiality.data.variety.Bank",
                    "attribute.confidentiality.data.variety.Classified",
                    "attribute.confidentiality.data.variety.Copyrighted",
                    "attribute.confidentiality.data.variety.Digital certificate",
                    "attribute.confidentiality.data.variety.Medical",
                    "attribute.confidentiality.data.variety.Payment",
                    "attribute.confidentiality.data.variety.Personal",
                    "attribute.confidentiality.data.variety.Internal",
                    "attribute.confidentiality.data.variety.Source code",
                    "attribute.confidentiality.data.variety.System",
                    "attribute.confidentiality.data.variety.Secrets",
                    "attribute.confidentiality.data.variety.Virtual currency",
                    "attribute.confidentiality.data.variety.Other"
                ]);
            } else if (attributes[i] == "Integrity") {
                selected_attributes = selected_attributes.concat([
                    "attribute.integrity.variety.Created account",
                    "attribute.integrity.variety.Defacement",
                    "attribute.integrity.variety.Hardware tampering",
                    "attribute.integrity.variety.Alter behavior",
                    "attribute.integrity.variety.Fraudulent transaction",
                    "attribute.integrity.variety.Log tampering",
                    "attribute.integrity.variety.Repurpose",
                    "attribute.integrity.variety.Misrepresentation",
                    "attribute.integrity.variety.Modify configuration",
                    "attribute.integrity.variety.Modify privileges",
                    "attribute.integrity.variety.Modify data",
                    "attribute.integrity.variety.Software installation",
                    "attribute.integrity.variety.Other"
                ]);
            } else {
                selected_attributes = selected_attributes.concat([attributes[i]]);
            }
        };
        return selected_attributes;
    };


    function format_chart_data(data) {
        // Takes data from the /paths/ API and formats it for the 'values' section of nld3

        var return_data = [];

        // format API returned data to that needed by the charting function
        for (var key in data) {
            return_data.push({"label": key, "value": data[key]})
        }

        // Sor tthe data
        return_data.sort(function(a, b) {
            a = a["value"];
            b = b["value"];

            if ( a == 0 & b != 0) {
                return 1;
            } else if (b == 0 & a != 0) {
                return -1;
            } else {
                return a < b ? -1 : (a > b ? 1: 0)
            }
        })

        // Return the data
        return return_data
    }
});