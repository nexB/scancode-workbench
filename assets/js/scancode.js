/*
 #
 # Copyright (c) 2016 nexB Inc. and others. All rights reserved.
 # http://nexb.com and https://github.com/nexB/scancode-toolkit/
 # The ScanCode software is licensed under the Apache License version 2.0.
 # AboutCode is a trademark of nexB Inc.
 #
 # You may not use this software except in compliance with the License.
 # You may obtain a copy of the License at: http://apache.org/licenses/LICENSE-2.0
 # Unless required by applicable law or agreed to in writing, software distributed
 # under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 # CONDITIONS OF ANY KIND, either express or implied. See the License for the
 # specific language governing permissions and limitations under the License.
 #
 */

$(document).ready(function () {
    $("#node-drop-down").change(function () {
        var numClueSelected = $("#node-drop-down").val().length;
        nodeview.resize(numClueSelected * 30, 180);
    });

    function onNodeClick (d) {
        var component = scanData.getComponent(d.id);
        var subNodes = $.map(table.rows().data(), function(x, i) {
            if (x.path.startsWith(d.id)) {
                return x;
            }
        });
        var licenses = $.map(subNodes, function(node, i) {
            return $.map(node.licenses ? node.licenses : [], function(license, j) {
                return license.short_name;
            });
        });
        licenses = $.unique(licenses.concat(component.licenses));

        var copyrights = $.unique($.map(subNodes, function(node, i) {
            return $.map(node.copyrights ? node.copyrights : [], function(copyright, j) {
                return copyright.statements.join(' ');
            });
        }));
        copyrights = $.unique(copyrights.concat(component.copyrights));

        var parties = $.unique($.map(subNodes, function(node, i) {
            return $.map(node.copyrights ? node.copyrights : [], function(copyright, j) {
                return copyright.holders;
            });
        }));
        parties = $.unique(parties.concat(component.party.name));

        var programming_language = $.unique($.map(subNodes, function(node, i) {
            return node.programming_language;
        }));
        programming_language = $.unique(programming_language.concat(component.programming_language));

        // update select2 selectors for node view component
        $("#select-license").html('').select2({
            data: licenses,
            multiple: true,
            placeholder: "Enter license",
            tags: true
        }, true);

        $("#select-owner").html('').select2({
            data: parties,
            multiple: true,
            maximumSelectionLength: 1,
            placeholder: "Enter owner",
            tags: true
        }, true);

        $("#select-copyright").html('').select2({
            data: copyrights,
            multiple: true,
            placeholder: "Enter copyright",
            tags: true
        }, true);

        $("#select-language").html('').select2({
            data: programming_language,
            multiple: true,
            maximumSelectionLength: 1,
            placeholder: "Enter language",
            tags: true
        }, true);

        $("#select-status").val(component.review_status);
        $('#component-name').val(component.name);
        $('#component-version').val(component.version);
        $('#select-license').val(component.licenses);
        $('#select-copyright').val(component.copyrights);
        $('#select-owner').val(component.party.name);
        $('#select-language').val(component.programming_language);
        $('#component-homepage-url').val(component.homepage_url);
        $('#component-notes').val(component.notes);

        // Notify only select2 of changes
        $('select').trigger('change.select2');

        $('#nodeModalLabel').text(d.id);
        $('#nodeModal').modal('show');
    }

    // Create a node view
    var nodeview = new NodeView({
        selector: "#nodeview",
        orientation: 'left-to-right',
        width: 800,
        height: 800,
        nodeWidth: 25,
        nodeHeight: 160,
        margin: {
            top: 80, bottom: 30,
            left: 100, right: 200
        },
        duration: 1000,

        // Update the nodes when data changes
        addNode: function (nodes) {
            var circle = nodes.append("circle")
                .on('click', function (d) {
                    nodeview.toggle(d.id)
                });

            // Setup directory nodes
            nodes.filter(function (d) {
                return d.scanData.type === "directory";
            })
                .attr("class", "node dir")
                .append("text")
                .attr("x", 10)
                .attr("alignment-baseline", "central")
                .text(function (d) {
                    var file_count = d.scanData.files_count;
                    var clue_count = 0;
                    ScanData.forEachNode(d, "_children", function(node) {
                        clue_count += (node.scanData.licenses || []).length;
                        clue_count += (node.scanData.copyrights || []).length;
                    })
                    return d.name +
                        " (" + file_count +
                        ", " + clue_count + ")";
                })
                .on("click", onNodeClick);

            // Setup file nodes
            nodes.filter(function (d) {
                return d.scanData.type !== "directory";
            })
                .attr("class", "node file")
                .append('g')
                .attr("class", "clues")
                .attr("x", 10)
                .on("click", onNodeClick);
        },
        updateNode: function(nodes) {
            // Update circles
            nodes.select("circle").attr("class", function (d) {
                while (d != undefined) {
                    var review_status = scanData.getComponent(d.id).review_status;
                    if (review_status !== "") return review_status;
                    d = d.parent;
                }
            })

            var fileNodes = nodes.filter(function (d) {
                return d.scanData.type !== "directory";
            });

            // Get the selected values
            var selected = $("#node-drop-down").val();

            // Select old clues
            var clueGroup = fileNodes.selectAll("g.clues");
            var clueNodes = clueGroup.selectAll("g")
                .data(selected, function (d) { return d; });

            // Create new clues
            var newClueNodes = clueNodes.enter()
                .append("g")
                .attr("class", function (d) { return "clue-" + d; })
                .style("opacity", 0);

            // Append clue rect
            var newRectNode = newClueNodes.append("rect");

            // Append clue text
            newClueNodes.append("text")
                .attr("alignment-baseline", "central")
                .text(function (d,i,j) {
                    var data = newClueNodes[j].parentNode.__data__;
                    if (d === 'filename') {
                        return data.name
                    } else if (d === 'license') {
                        return $.map(data.scanData.licenses, function(license, i) {
                            return license.short_name;
                        }).join(", ");
                    } else if (d === 'copyright') {
                        return $.map(data.scanData.copyrights, function(copyright, i) {
                            return copyright.statements.join(" ");
                        }).join(", ");
                    }
                });

            // Update rect size (has to be done after text is added)
            clueNodes.select("rect")
                .attr("y", function(d) {
                    return -this.parentNode.getBBox().height/2;
                })
                .attr("width", function(d) {
                    return this.parentNode.getBBox().width;
                })
                .attr("height", function(d) {
                    return this.parentNode.getBBox().height;
                });

            // Update each clue's translation and set opacity to 1
            clueNodes.transition().duration(1000)
                .style("opacity", 1)
                .each("end", function (d) {
                    d3.select(this).style("opacity", "inherit")
                })
                .attr('transform', function (d, i) {
                    return "translate("+10+","+(25*i)+")"
                })

            // Update removed clues
            clueNodes.exit().transition().duration(1000)
                .style("opacity", 0)
                .remove();

            nodes.select("g.dir-node").transition().duration(1000)
                .attr('transform', "translate(10,0)");
        }
    });

    // Node view width
    $("svg")
        .attr('width', '100%')

    $('#save-component').on('click', function () {
        var id = $('#nodeModalLabel').text();
        var party = {};
        if ($('#select-owner').val()) {
            party = {name: $('#select-owner').val()[0], role: 'owner'}
        }
        var component = {
            review_status: $("#select-status").val(),
            name: $('#component-name').val(),
            version: $('#component-version').val(),
            licenses: $('#select-license').val(),
            copyrights: $('#select-copyright').val(),
            party: party,
            homepage_url: $('#component-homepage-url').val(),
            notes: $('#component-notes').val()
        };
        if ($('#select-language').val()) {
            component.programming_language = $('#select-language').val()[0];
        }
        scanData.setComponent(id, component);
        $('#nodeModal').modal('hide');
        nodeview.redraw()
    });

    $('#node-drop-down').select2({
        closeOnSelect: false,
        placeholder: "select me"
    });

    var jstree = $('#jstree').jstree({
        "types": {
            "folder": {
                "icon": "glyphicon glyphicon-folder-close"
            },
            "file": {
                "icon": "glyphicon glyphicon-file"
            }
        },
        "plugins": [ "types"]
    })
        .on('open_node.jstree', function (evt, data) {
            data.instance.set_icon(
                data.node,
                'glyphicon glyphicon-folder-open');
        })
        .on('close_node.jstree', function (evt, data) {
            data.instance.set_icon(
                data.node,
                'glyphicon glyphicon-folder-close');
        })
        // Get the node id when selected
        .on('select_node.jstree', function (evt, data) {
            table.columns(0).search(data.node.id).draw();
            nodeview.update(data.node.id);
        });

    var scanData = null;

    // Define Datatable buttons
    var LICENSE_COLUMNS = ScanData.LOCATION_COLUMN.concat(ScanData.LICENSE_COLUMNS);
    var COPYRIGHT_COLUMNS = ScanData.LOCATION_COLUMN.concat(ScanData.COPYRIGHT_COLUMNS);
    var ORIGIN_COLUMNS = ScanData.LOCATION_COLUMN.concat(ScanData.ORIGIN_COLUMNS);

    // Load nedb and create an in-memory databse
    var Datastore = require('nedb');
    var db = new Datastore();

    // Create a DataTable
    var table = $('#clues-table')
        .DataTable({
            "info": false,
            "colReorder": true,
            "serverSide": true,
            "processing": true,
            "ajax": ajaxDataTableCall,
            "columns": ScanData.TABLE_COLUMNS,
            "fixedColumns": {
                leftColumns: 1
            },
            // TODO: We want to use scroller but the current version of the
            // plugin doesn't work with fixedColumns. Try updating
            // "scroller": true,
            "scrollX": true,
            "scrollY": '75vh',
            "stateSave": true,
            "deferRender": true,
            "buttons": [
                {   // Do not allow the first column to be hidden
                    extend: 'colvis',
                    columns: ':not(:first-child)',
                    collectionLayout: 'fixed two-column'
                },
                {
                    // Show only copyright columns
                    extend: 'colvisGroup',
                    text: 'Copyright info',
                    show: $.map(COPYRIGHT_COLUMNS, function(column, i) {
                        return column.name + ":name";
                    }),
                    hide: $.map($(ScanData.TABLE_COLUMNS).not(COPYRIGHT_COLUMNS),
                        function(column, i) { return column.name + ":name"; })
                },
                {
                    // Show only license columns
                    extend: 'colvisGroup',
                    text: 'License info',
                    show: $.map(LICENSE_COLUMNS, function(column, i) {
                        return column.name + ":name";
                    }),
                    hide: $.map($(ScanData.TABLE_COLUMNS).not(LICENSE_COLUMNS),
                        function(column, i) { return column.name + ":name"; })
                },
                {
                    // Show only origin columns
                    extend: 'colvisGroup',
                    text: 'Origin info',
                    show: $.map(ORIGIN_COLUMNS, function(column, i) {
                        return column.name + ":name";
                    }),
                    hide: $.map($(ScanData.TABLE_COLUMNS).not(ORIGIN_COLUMNS),
                        function(column, i) { return column.name + ":name"; })
                },
                {
                    extend: 'colvisGroup',
                    text: 'Show all columns',
                    show: ':hidden'
                }
            ],
            dom:
            // Needed to keep datatables buttons and search inline
                "<'row'<'col-sm-9'B><'col-sm-3'f>>" +
                    "<'row'<'col-sm-12'tr>>" +
                    "<'row'<'col-sm-5'i><'col-sm-7'p>>"
        });

    // Create a table with analyzed Components from node view
    var componentsTable = $('#components-table')
        .DataTable( {
            columns: [
                {
                    data: 'name',
                    title: 'Name',
                    name: 'name'
                },
                {
                    data: 'version',
                    title: 'Version',
                    name: 'version'
                },
                {
                    data: 'party.name',
                    title: 'Owner',
                    name: 'party name',
                    defaultContent: ""
                },
                {
                    data: 'license_expression',
                    title: 'License',
                    name: 'license_expression',
                    defaultContent: ""
                },
                {
                    data: 'programming_language',
                    title: 'Programming Language',
                    name: 'programming_language',
                    defaultContent: ""
                },
                {
                    data: 'homepage_url',
                    title: 'Homepage URL',
                    name: 'homepage_url',
                    defaultContent: ""
                },
                {
                    data: 'notes',
                    title: 'Notes',
                    name: 'notes',
                    defaultContent: ""
                }
            ],
            dom:
            // Needed to keep datatables buttons and search inline
                "<'row'<'col-sm-9'B><'col-sm-3'f>>" +
                    "<'row'<'col-sm-12'tr>>" +
                    "<'row'<'col-sm-5'i><'col-sm-7'p>>",
            buttons: [
                {
                    name: 'uploadDeja',
                    text: '<i class=" fa fa-cloud-upload"></i> Upload Components'

                }
            ],
            "language": {
              "emptyTable": "No Components created."
            }

        });

        componentsTable.buttons().container().attr({
            'id': 'show-components',
            'data-toggle': 'modal',
            'data-placement': 'right',
            'title': 'Upload Components to DejaCode',
            'data-target':'#componentExportModal'
        });


    // Show DataTable. Hide node view and component summary table
    $( "#show-datatable" ).click(function() {
        $("#clues-table").show();
        $("#node-container").hide();
        $("#clues-table_wrapper").show();
        $("#component-container").hide();
        $('#leftCol').addClass('col-md-2');
        $('#tabbar').removeClass('col-md-11');
        $('#tabbar').addClass('col-md-9');
        $('#leftCol').show();
        table.draw();
    });

    // Show node view. Hide DataTable and component summary table
    $("#show-tree").click(function() {
        $("#node-container").show();
        $("#clues-table").hide();
        $("#clues-table_wrapper").hide();
        $("#component-container").hide();
        $('#leftCol').addClass('col-md-2');
        $('#tabbar').removeClass('col-md-11');
        $('#tabbar').addClass('col-md-9');
        $('#leftCol').show();
        nodeview.redraw();
    });

    // Show component summary table. Hide DataTable and node view
    $("#table-test").click(function() {
        $('#leftCol').removeClass('col-md-2');
        $('#tabbar').removeClass('col-md-9');
        $('#tabbar').addClass('col-md-11');
        $('#leftCol').hide();
        $("#component-container").show();
        $("#clues-table").hide();
        $("#node-container").hide();
        $("#clues-table_wrapper").hide();
        componentsTable.clear();
        componentsTable.rows.add(scanData.toSaveFormat().components);
        componentsTable.draw();
    });

    // Open a json file
    var dialog = require('electron').remote.dialog;
    $('#open-file').click(function() {
        dialog.showOpenDialog(function (fileNames) {
            if (fileNames === undefined) return;

            var fileName = fileNames[0];

            // create a database
            db = new Datastore();
            $.getJSON(fileName, function(json) {

                // Show error for scans missing file type information
                if (json.files != undefined && json.files.length > 0 &&
                     json.files[0].type === undefined) {
                         dialog.showErrorBox(
                             "Missing File Type Information",
                             "Missing file 'type' information in the " +
                             "scanned data. \n\nThis probably means you ran" +
                             " the scan without the -i option in ScanCode. " +
                             "The app requires file information from a " +
                             "ScanCode scan. Rerun the scan using ./scancode" +
                             " -clip options."
                         );
                     }

                // Flatten the json data to allow sorting and searching
                var flattenedData = $.map(json.files, function(file, i) {
                    return flattenData(file);
                });

                // Store in the database
                db.insert(flattenedData, function (err, newDoc) {
                    // reload the DataTable after all insertions are done.
                    table.ajax.reload();
                });

                scanData = new ScanData(json);

                // loading data into jstree
                jstree.jstree(true).settings.core.data = scanData.jsTreeData;
                jstree.jstree(true).refresh(true);

                // loading data into the node view
                nodeview.setData(scanData.nodeViewData);
            });
        });
    });

    // This function is called every time DataTables needs to be redrawn.
    // For details on the parameters https://datatables.net/manual/server-side#Legacy
    function ajaxDataTableCall(input, callback, settings) {
        dFind = $.Deferred();

        // Build the database query for both global searches and searches on
        // particular columns
        var query = {
            $where : function() {
                var globalSearch = input.search.value;

                for (var i = 0; i < input.columns.length; i++) {
                    // get all values
                    var value = this[input.columns[i].name]
                    var valueStr = String(value);

                    // If column search exists, match on column
                    var columnSearch = input.columns[i].search.value;
                    if (columnSearch && (!value || valueStr.indexOf(columnSearch) != 0)) {
                        return false;
                    }

                    // If global search exists, match on any column
                    if (value && valueStr.indexOf(globalSearch) >= 0) {
                        return true;
                    }
                }
                return false;
            }
        }

        var dbFind = db.find(query);

        // Sort by column if needed
        if (input.order.length > 0) {
            var columnIndex = input.order[0].column;
            var columnName = input.columns[columnIndex].name;
            var direction = input.order[0].dir == 'asc' ? 1 : -1;
            var sortObj = {};
            sortObj[columnName] = direction;
            dbFind = dbFind.sort(sortObj);
        }

        // Only take the chunk of data DataTables needs
        dbFind = dbFind.skip(input.start);
        if (input.length >= 0) {
            dbFind = dbFind.limit(input.length);
        }

        // Check input.order to handle sorting
        dbFind.exec(function (err, docs) {
                if (err) {
                    throw err;
                }
                dFind.resolve(docs);
        });

        // Count all documents in the datastore
        dCountTotal = $.Deferred();
        db.count({})
            .exec(function (err, count) {
                if (err) {
                    throw err;
                }
                dCountTotal.resolve(count);
        });

        // Count only filtered documents in the datastore
        dCountFiltered = $.Deferred();
        db.count(query)
            .exec(function (err, count) {
                if (err) {
                    throw err;
                }
                dCountFiltered.resolve(count);
        });

        // Wait for all three of the Deferred objects to finish
        $.when(dFind, dCountTotal, dCountFiltered)
            .then(function (docs, countTotal, countFiltered) {
               if (docs) {
                   callback({
                       draw: input.draw,
                       data: docs,
                       recordsFiltered: countFiltered,
                       recordsTotal: countTotal
                   })
            }
        });
    }

    // Flatten ScanCode results data to load into database
    function flattenData(data) {
        return {
            path: data.path,
            copyright_statements: flattenArrayOfArray(data.copyrights, 'statements'),
            copyright_holders: flattenArrayOfArray(data.copyrights, 'holders'),
            copyright_authors: flattenArrayOfArray(data.copyrights, 'authors'),
            copyright_start_line: flattenArray(data.copyrights, 'start_line'),
            copyright_end_line: flattenArray(data.copyrights, 'end_line'),
            license_key: flattenArray(data.licenses, 'key'),
            license_score: flattenArray(data.licenses, 'score'),
            license_shortname: flattenArray(data.licenses, 'short_name'),
            license_category: flattenArray(data.licenses, 'category'),
            license_owner: flattenArray(data.licenses, 'party'),
            license_homepage_url: flattenArrayOfUrl(data.licenses, 'homepage_url'),
            license_text_url: flattenArrayOfUrl(data.licenses, 'text_url'),
            license_djc_url: flattenArrayOfUrl(data.licenses, 'dejacode_url'),
            license_spdx_key: flattenArray(data.licenses, 'spdx_license_key'),
            license_start_line: flattenArray(data.licenses, 'start_line'),
            license_end_line: flattenArray(data.licenses, 'end_line'),
            email: flattenArray(data.emails, 'email'),
            email_start_line: flattenArray(data.emails, 'start_line'),
            email_end_line: flattenArray(data.emails, 'end_line'),
            url: flattenArrayOfUrl(data.urls, 'url'),
            url_start_line: flattenArrayOfUrlLine(data.urls, 'start_line'),
            url_end_line: flattenArrayOfUrlLine(data.urls, 'end_line'),
            infos_type: data.type,
            infos_file_name: data.name,
            infos_file_extension: data.extension,
            infos_file_data: data.date,
            infos_file_size: data.size,
            infos_file_sha1: data.sha1,
            infos_md5: data.md5,
            infos_file_count: data.files_count,
            infos_mime_type: data.mime_type,
            infos_file_type: data.file_type,
            infos_programming_language: data.programming_language,
            infos_is_binary: data.is_binary,
            infos_is_text: data.is_text,
            infos_is_archive: data.is_archive,
            infos_is_media: data.is_media,
            infos_is_source: data.is_source,
            infos_is_script: data.is_script,
            packages_type: flattenArray(data.packages, 'type'),
            packages_packaging: flattenArray(data.packages, 'packaging'),
            packages_primary_language: flattenArray(data.packages, 'primary_language')
        }
    }

    // array: [
    //     {key: [val0, val1]},
    //     {key: [val2, val3]},
    // ]
    // => 'val0</br>val1<hr/>val2</br>val3'
    function flattenArrayOfArray(array, key) {
        return $.map(array ? array : [], function(elem, i) {
            return elem[key] ? elem[key].join("</br>") : [];
        }).join("<hr/>");
    }

    // array: [
    //     {key: val0},
    //     {key: val1},
    // ]
    // => 'val0<hr/>val1'
    function flattenArray(array, key) {
        return $.map(array ? array : [], function(elem, i) {
            return elem[key] ? elem[key] : [];
        }).join("<hr/>");
    }

    // array: [
    //     {key: val0},
    //     {key: val1},
    // ]
    // => 'val0</br>val1'
    function flattenArrayOfUrlLine(array, key) {
        return $.map(array ? array : [], function(elem, i) {
            return elem[key] ? elem[key] : [];
        }).join("</br>");
    }

    // array: [
    //     {key: url0},
    //     {key: url1},
    // ]
    // => '<a href=url0 target="_blank">url0</a><br/>
    //     <a href=url1 target="_blank">url1</a>'
    function flattenArrayOfUrl(array, key) {
        return $.map(array ? array : [], function(elem, i) {
            var href = elem[key];

            return '<a href="'+href+'" target="_blank">'+href+'</a>';
        }).join("</br>");
    }

    // Save component file
    $( "#save-file" ).click(function() {
        // Get data from table to JSON
        var fs = require('fs');
        var tableData = JSON.stringify(scanData.toSaveFormat());
        dialog.showSaveDialog({properties: ['openFile'],
            title: "Save as JSON file",
            filters: [{name: 'JSON File Type',
            extensions: ['json']}]},
            function (fileName) {
                if (fileName === undefined) return;
                    fs.writeFile(fileName, tableData, function (err) {
                });
            });
    });

    // Submit components to a DejaCode Product via ProductComponent API
    $('#componentSubmit').on('click', function () {
        var createdComponents = scanData.toSaveFormat().components;
        // Get product name and version
        var productNameVersion = $('#product-name').val()
            .concat(':', $('#product-version').val());
        var apiUrl = $('#apiURLDejaCode').val();
        var apiKey = $('#apiKey').val();
        uploadComponents( apiUrl, createdComponents, apiKey, productNameVersion );
        $('#componentExportModal').modal('hide');
    });

    // Make node view modal box draggable
    $("#nodeModal").draggable({ handle: ".modal-header" });

});