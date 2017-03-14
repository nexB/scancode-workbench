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
        nodeView.resize(numClueSelected * 30, 180);
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
        nodeView.redraw()
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
            nodeView.update(data.node.id);
        });

    var scanData = null;
    var aboutCodeDB = new AboutCodeDB();
    var table = new AboutCodeDataTable("#clues-table", aboutCodeDB);

    // Create a table with analyzed Components from node view
    var componentsTable = $("#components-table")
        .DataTable( {
            columns: [
                {
                    data: "name",
                    title: "Name",
                    name: "name"
                },
                {
                    data: "version",
                    title: "Version",
                    name: "version"
                },
                {
                    data: "party.name",
                    title: "Owner",
                    name: "party name",
                    defaultContent: ""
                },
                {
                    data: "license_expression",
                    title: "License",
                    name: "license_expression",
                    defaultContent: ""
                },
                {
                    data: "programming_language",
                    title: "Programming Language",
                    name: "programming_language",
                    defaultContent: ""
                },
                {
                    data: "homepage_url",
                    title: "Homepage URL",
                    name: "homepage_url",
                    defaultContent: ""
                },
                {
                    data: "notes",
                    title: "Notes",
                    name: "notes",
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
                    name: "uploadDeja",
                    text: '<i class=" fa fa-cloud-upload"></i> Upload Components'
                }
            ],
            "language": {
              "emptyTable": "No Components created."
            }

        });

        componentsTable.buttons().container().attr({
            "id": "show-components",
            "data-toggle": "modal",
            "data-placement": "right",
            "title": "Upload Components to DejaCode",
            "data-target":"#componentExportModal"
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
        nodeView.redraw();
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
    var nodeView;
    $('#open-file').click(function() {
        dialog.showOpenDialog(function (fileNames) {
            if (fileNames === undefined) return;

            var fileName = fileNames[0];

            $.getJSON(fileName, function(json) {

                // Show error for scans missing file type information
                if (json.files != undefined && json.files.length > 0
                    && json.files[0].type === undefined) {
                    dialog.showErrorBox(
                        "Missing File Type Information",
                        "Missing file 'type' information in the " +
                        "scanned data. \n\nThis probably means you ran " +
                        "the scan without the -i option in ScanCode. " +
                        "The app requires file information from a " +
                        "ScanCode scan. Rerun the scan using ./scancode " +
                        "-clip options."
                    );
                }

                aboutCodeDB = new AboutCodeDB(json, function() {
                    // reload the DataTable after all insertions are done.
                    table.aboutCodeDB = aboutCodeDB;
                    table.ajax().reload();
                });

                scanData = new ScanData(json);
                nodeView = new AboutCodeNodeView(scanData, onNodeClick);

                // loading data into jstree
                jstree.jstree(true).settings.core.data = scanData.jsTreeData;
                jstree.jstree(true).refresh(true);
            });
        });
    });

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