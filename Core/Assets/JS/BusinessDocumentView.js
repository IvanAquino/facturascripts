/*
 * This file is part of FacturaScripts
 * Copyright (C) 2013-2018 Carlos Garcia Gomez <carlos@facturascripts.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

var autocompleteColumns = [];
var documentLineData = [];
var documentUrl = "";
var hsTable = null;

function beforeChange(changes, source) {
    // Check if the value has changed. Not Multiselection
    if (changes !== null && changes[0][2] !== changes[0][3]) {
        for (var i = 0; i < autocompleteColumns.length; i++) {
            if (changes[0][1] === autocompleteColumns[i]) {
                // apply for autocomplete columns
                if (typeof changes[0][3] === "string") {
                    changes[0][3] = changes[0][3].split(" | ", 1)[0];
                }
            }
        }
    }
}

function businessDocViewAutocompleteGetData(formId, field, source, fieldcode, fieldtitle, term) {
    var formData = {};
    var rawForm = $("form[id=" + formId + "]").serializeArray();
    $.each(rawForm, function (i, input) {
        formData[input.name] = input.value;
    });
    formData["action"] = "autocomplete";
    formData["field"] = field;
    formData["source"] = source;
    formData["fieldcode"] = fieldcode;
    formData["fieldtitle"] = fieldtitle;
    formData["term"] = term;
    return formData;
}

function documentRecalculate() {
    var data = {};
    $.each($("form[name=f_document_primary]").serializeArray(), function (key, value) {
        data[value.name] = value.value;
    });
    data.action = "recalculate-document";
    data.lines = getGridData();
    console.log("data", data);

    $.ajax({
        type: "POST",
        url: documentUrl,
        dataType: "json",
        data: data,
        success: function (results) {
            $("#doc_total").val(results.total);

            var rowPos = 0;
            results.lines.forEach(function (element) {
                var visualRow = hsTable.toVisualRow(rowPos);
                documentLineData.rows[visualRow] = element;
                rowPos++;
            });

            hsTable.render();
            console.log("results", results);
        },
        error: function (xhr, status, error) {
            alert(xhr.responseText);
        }
    });
}

function documentSave() {
    $("#btn-document-save").prop("disabled", true);

    var data = {};
    $.each($("form[name=f_document_primary]").serializeArray(), function (key, value) {
        data[value.name] = value.value;
    });
    data.action = "save-document";
    data.lines = getGridData();
    console.log(data);
    $.ajax({
        type: "POST",
        url: documentUrl,
        dataType: "text",
        data: data,
        success: function (results) {
            if (results.substring(0, 3) === "OK:") {
                alert('OK');
                location.href = results.substring(3);
            } else {
                alert(results);
            }
        }
    });

    $("#btn-document-save").prop("disabled", false);
}

function getGridData() {
    var rowIndex, lines = [];
    for (var i = 0, max = documentLineData.rows.length; i < max; i++) {
        rowIndex = hsTable.toVisualRow(i);
        if (hsTable.isEmptyRow(rowIndex)) {
            continue;
        }

        lines[rowIndex] = documentLineData.rows[i];
    }
    return lines;
}

function setAutocompletes(columns) {
    for (var key = 0; key < columns.length; key++) {
        if (columns[key].type === "autocomplete") {
            autocompleteColumns.push(columns[key].data);
            var source = columns[key].source["source"];
            var field = columns[key].source["fieldcode"];
            var title = columns[key].source["fieldtitle"];
            columns[key].source = function (query, process) {
                var ajaxData = {
                    term: query,
                    action: "autocomplete",
                    field: field,
                    source: source,
                    fieldcode: field,
                    fieldtitle: title
                };
                $.ajax({
                    type: "POST",
                    url: documentUrl,
                    dataType: "json",
                    data: ajaxData,
                    success: function (response) {
                        var values = [];
                        response.forEach(function (element) {
                            values.push(element.key + " | " + element.value);
                        });
                        process(values);
                    }
                });
            };
        }
    }

    return columns;
}

$(document).ready(function () {
    var container = document.getElementById("document-lines");
    hsTable = new Handsontable(container, {
        data: documentLineData.rows,
        columns: setAutocompletes(documentLineData.columns),
        rowHeaders: true,
        colHeaders: documentLineData.headers,
        stretchH: "all",
        autoWrapRow: true,
        manualRowResize: true,
        manualColumnResize: true,
        manualRowMove: true,
        manualColumnMove: false,
        contextMenu: true,
        filters: true,
        dropdownMenu: true,
        preventOverflow: "horizontal",
        minSpareRows: 5,
        enterMoves: {row: 0, col: 1}
    });

    Handsontable.hooks.add("beforeChange", beforeChange);
    Handsontable.hooks.add("afterChange", documentRecalculate);

    $("#doc_codserie").change(function () {
        documentRecalculate();
    });

    $('.autocomplete-dc').each(function () {
        var field = $(this).attr('data-field');
        var source = $(this).attr('data-source');
        var fieldcode = $(this).attr('data-fieldcode');
        var fieldtitle = $(this).attr('data-fieldtitle');
        var formName = $(this).closest('form').attr('name');
        $(this).autocomplete({
            source: function (request, response) {
                $.ajax({
                    method: 'POST',
                    url: documentUrl,
                    data: businessDocViewAutocompleteGetData(formName, field, source, fieldcode, fieldtitle, request.term),
                    dataType: 'json',
                    success: function (results) {
                        var values = [];
                        results.forEach(function (element) {
                            values.push({key: element.key, value: element.key + " | " + element.value});
                        });
                        response(values);
                    },
                    error: function (msg) {
                        alert(msg.status + ' ' + msg.statusText);
                    }
                });
            },
            select: function (event, ui) {
                $('#' + field + 'Autocomplete').val(ui.item.key);
                ui.item.value = ui.item.value.split(' | ')[1];
            }
        });
    });
});
