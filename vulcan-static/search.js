
// pattern is: slice name maps to dict 1
// in dict 1, outer layer id maps to outer layer in dict form
// outer layer dict has entries "label", "description", and "innerLayers"
// The first two are strings
// innerLayers is a dictionary again, mapping inner layer id to inner layer in dict form
// inner layer dict has entries "label" and "description" (string and list of strings respectively)
let SEARCH_PATTERNS
    // = {
//     "Sentence": {
//         "OuterTableCellsLayer": {
//             "innerLayers": {
//                 "CellContentEquals": {
//                     "label": ["Cell content equals", ""],
//                     "description": "This checks if the cell content equals the given string (modulo casing and outer whitespace)."
//                 },
//                 "CellContentMatches": {
//                     "label": ["Cell content matches", "(regular expression)"],
//                     "description": "This checks if the cell content matches the given regular expression."
//                 }
//             },
//             "label": "Any cell in the table matches:",
//             "description": "This layer checks if any cell in a table matches the given criteria, and highlights the cells that do."
//         },
//         "OuterTableAsAWholeLayer": {
//             "innerLayers": {
//                 "ColumnCountAtLeast": {
//                     "label": ["The sentence has at least length", " (or the table has at least this many columns)"],
//                     "description": "Checks minimum sentence length / table width."
//                 }
//             },
//             "label": "The sentence/table as a whole matches:",
//             "description": "This layer checks if the sentence (or table) itself matches a given criterion."
//         }
//     },
//     "Tree": {
//         "OuterGraphNodeLayer": {
//             "innerLayers": {
//                 "NodeContentEquals": {
//                     "label": ["Node has label", ""],
//                     "description": "This checks if a node is labeled with the given string (modulo casing and outer whitespace)."
//                 }
//             },
//             "label": "Any node in the graph matches:",
//             "description": "This layer checks if any node in a graph matches the given criteria, and highlights the nodes that do."
//         }
//     }
// }

let searchWindowVisible = false
let searchWindowContainer = null
let searchWindowCanvas = null

// pastel green, pastel red, pastel yellow, pastel blue, pastel orange, pastel purple
const FILTER_COLORS = ["#b3ffb3", "#ff9999", "#ffffb3", "#b3ffff", "#ffb366", "#e6ccff"]
const BORDER_COLOR = "#444444"
const SEARCH_WINDOW_WIDTH = 1000
const SEARCH_WINDOW_HEIGHT = 300

const FILTER_SELECTOR_SIZE = 40
const FILTER_SELECTOR_BUFFER = 15

const SELECTOR_MASK_MARGIN = 10
const SELECTOR_MASK_ROUNDING = 10
const SELECTOR_MASK_CLASSNAME = "searchSelectorMask"
const SELECTOR_TEXT_CLASSNAME = "searchSelectorText"
const OUTER_SEARCH_LAYER_CLASSNAME = "outerSearchLayer"
const INNER_SEARCH_LAYER_CLASSNAME = "innerSearchLayer"
const EMPTY_SELECTION_TEXT = "-- Select --"

let searchFilters
let searchFilterRects

function initializeSearchFilters() {
    searchFilters = []
    searchFilterRects = []
    addEmptySearchFilter()
    // addDebuggingSearchFilters()
}

function addDebuggingSearchFilters() {
    let uniqueid3 = makeUniqueInnerLayerID("NodeContentEquals")
    let argsGraph = {}
    argsGraph[uniqueid3] = ["and"]
    addSearchFilter(new FilterInfo("Gold graph", "OuterGraphNodeLayer", [uniqueid3],
        argsGraph))
}

function addEmptySearchFilter() {
    addSearchFilter(new FilterInfo(null, null, []))
}

function addSearchFilter(filterInfo) {
    searchFilters.push(filterInfo)
}

function createSearchWindowContainer() {
    // get the position of the search icon
    let searchButtonPosition = d3.select("#searchButton").node().getBoundingClientRect()
    let searchButtonHeight = searchButtonPosition.height
    let searchButtonX = searchButtonPosition.x
    let searchButtonY = searchButtonPosition.y



    searchWindowVisible = true
    searchWindowContainer = d3.select("div#chartId")
        .append("div")
        .style("position", "absolute")
        .style("top", (searchButtonY + searchButtonHeight + 5).toString() + "px")
        .style("left", searchButtonX.toString() + "px")
    // .style("border", "3px solid black")
}

function createSearchWindowCanvas() {
    searchWindowCanvas = searchWindowContainer.append("svg")
        .attr("viewBox", "0 0 " + SEARCH_WINDOW_WIDTH + " " + SEARCH_WINDOW_HEIGHT)
        .attr("width", SEARCH_WINDOW_WIDTH)  // that's 3 + 3 for the borders, I think, but I don't know where the 10 come from
        .attr("height", SEARCH_WINDOW_HEIGHT)
        .style("background-color", "white")
        .style("border", "2px solid " + BORDER_COLOR)
        .style("position", "relative")
}

function drawFilterSelectorMask(activeFilterSelectorRect) {
    let indentedLeftBoundary = parseFloat(activeFilterSelectorRect.attr("x"))
        + FILTER_SELECTOR_SIZE + SELECTOR_MASK_MARGIN
    let selectorRectBottomWithMargin = parseFloat(activeFilterSelectorRect.attr("y")) + FILTER_SELECTOR_SIZE + 5
    let selectorRectTopWithMargin = parseFloat(activeFilterSelectorRect.attr("y")) - 5
    let bottom = SEARCH_WINDOW_HEIGHT - SELECTOR_MASK_MARGIN - 45 // the 45 makes space for the "search now" button
    let right = SEARCH_WINDOW_WIDTH - SELECTOR_MASK_MARGIN
    let top = SELECTOR_MASK_MARGIN
    let left = SELECTOR_MASK_MARGIN


    // should be able to generalize the below, by setting it up for a middle one, and not drawing a line if its length is negative.
    drawXLine(indentedLeftBoundary, right, top)
    drawCornerTopRight(right, top)
    drawYLine(right, top, bottom)
    drawCornerBottomRight(right, bottom)
    drawXLine(indentedLeftBoundary, right, bottom)
    if (selectorRectBottomWithMargin < bottom - 2*SELECTOR_MASK_ROUNDING) {
        drawCornerBottomLeft(indentedLeftBoundary, bottom)
        drawYLine(indentedLeftBoundary, selectorRectBottomWithMargin, bottom)
        drawCornerTopRight(indentedLeftBoundary, selectorRectBottomWithMargin)
    } else {
        drawLine(indentedLeftBoundary, bottom, indentedLeftBoundary, selectorRectBottomWithMargin, SELECTOR_MASK_ROUNDING, 0)
    }
    drawXLine(left, indentedLeftBoundary, selectorRectBottomWithMargin)
    drawCornerBottomLeft(left, selectorRectBottomWithMargin)
    drawYLine(left, selectorRectTopWithMargin, selectorRectBottomWithMargin)
    drawCornerTopLeft(left, selectorRectTopWithMargin)
    drawXLine(left, indentedLeftBoundary, selectorRectTopWithMargin)
    if (selectorRectTopWithMargin > top + 2*SELECTOR_MASK_ROUNDING) {
        drawCornerBottomRight(indentedLeftBoundary, selectorRectTopWithMargin)
        drawYLine(indentedLeftBoundary, top, selectorRectTopWithMargin)
        drawCornerTopLeft(indentedLeftBoundary, top)
    } else {
        drawLine(indentedLeftBoundary, selectorRectTopWithMargin, indentedLeftBoundary, top, SELECTOR_MASK_ROUNDING, 0)
    }

}

function createFilterSelectorRect(filterSelectorIndex) {
    let y = 15 + filterSelectorIndex * (FILTER_SELECTOR_SIZE + FILTER_SELECTOR_BUFFER)
    let selectorRectGroup = searchWindowCanvas.append("g")
        .attr("transform", "translate(0, 0)")
    return selectorRectGroup.append("rect")
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("x", 15)
        .attr("y", y)
        .attr("width", FILTER_SELECTOR_SIZE)
        .attr("height", FILTER_SELECTOR_SIZE)
        .attr("fill", FILTER_COLORS[filterSelectorIndex % FILTER_COLORS.length])
        .attr("stroke", BORDER_COLOR)
        .attr("stroke-width", 2)
        .style("opacity", "0.5") // is by default unselected
        .on("click", function () {
            selectSelectorRect(d3.select(this))
        })
}

function createAddFilterButton() {
    let y = 15 + searchFilters.length * (FILTER_SELECTOR_SIZE + FILTER_SELECTOR_BUFFER)
    let buttonGroup = searchWindowCanvas.append("g")
        .attr("id", "addFilterButton")
        .attr("transform", "translate(0, 0)")
    // plus sign
    buttonGroup.append("line")
        .attr("x1", 15 + FILTER_SELECTOR_SIZE / 2)
        .attr("y1", y + FILTER_SELECTOR_SIZE / 4)
        .attr("x2", 15 + FILTER_SELECTOR_SIZE / 2)
        .attr("y2", y + 3 * FILTER_SELECTOR_SIZE / 4)
        .attr("stroke", "#aaaaaa")
        .attr("stroke-width", 2)
    buttonGroup.append("line")
        .attr("x1", 15 + FILTER_SELECTOR_SIZE / 4)
        .attr("y1", y + FILTER_SELECTOR_SIZE / 2)
        .attr("x2", 15 + 3 * FILTER_SELECTOR_SIZE / 4)
        .attr("y2", y + FILTER_SELECTOR_SIZE / 2)
        .attr("stroke", "#aaaaaa")
        .attr("stroke-width", 2)
    // border (and clickable thing, on top)
    buttonGroup.append("rect")
        .attr("rx", 5)
        .attr("ry", 5)
        .attr("x", 15)
        .attr("y", y)
        .attr("width", FILTER_SELECTOR_SIZE)
        .attr("height", FILTER_SELECTOR_SIZE)
        // transparent fill
        .attr("fill", "rgba(0,0,0,0)")
        .attr("stroke", "#aaaaaa")
        .attr("stroke-width", 2)
        // dashed border
        .attr("stroke-dasharray", "5,5")
        .on("click", function () {
            addFilter()
        })
}

function addFilter() {
    addEmptySearchFilter()
    searchFilterRects.push(createFilterSelectorRect(searchFilters.length - 1))
    d3.select("#addFilterButton").remove()
    createAddFilterButton()
    selectSelectorRect(searchFilterRects[searchFilterRects.length - 1])
}

function removeFilter(selectedFilterIndex) {
    // remove all search filters after (and including) the selected one
    for (let i = selectedFilterIndex; i < searchFilters.length; i++) {
        searchFilterRects[i].remove()
    }
    d3.select("#addFilterButton").remove()

    // remove the search filter
    searchFilters.splice(selectedFilterIndex, 1)
    // remove all search filter rects after (and including) the selected one
    searchFilterRects.splice(selectedFilterIndex)
    if (searchFilters.length <= selectedFilterIndex) {
        selectedFilterIndex = searchFilters.length - 1
    } else {
        // shift colors
        removedColor = FILTER_COLORS[selectedFilterIndex]
        FILTER_COLORS.splice(selectedFilterIndex, 1)
        FILTER_COLORS.push(removedColor)
    }

    // re-add the search filter rects below the selected one
    for (let i = selectedFilterIndex; i < searchFilters.length; i++) {
        searchFilterRects[i] = createFilterSelectorRect(i)
    }
    createAddFilterButton()


    selectSelectorRect(searchFilterRects[selectedFilterIndex])
}

function createRemoveFilterButton(selectedFilterIndex) {
    let removeButton = d3.select("div#chartId").append("button")
        .attr("id", "removeFilterButton")
        .text("Remove this filter")
        .style("position", "absolute")
        .style("left", (searchWindowCanvas.node().getBoundingClientRect().right - 150) + "px")
        .style("top", (searchWindowCanvas.node().getBoundingClientRect().top + SELECTOR_MASK_MARGIN + 10) + "px")
        .on("click", function () {

            removeFilter(selectedFilterIndex);

        })
        .attr("class", SELECTOR_TEXT_CLASSNAME)
}

function selectSelectorRect(selectorRect) {
    selectorRect.style("opacity", "1")
    let selectedFilterIndex;
    for (let i = 0; i < searchFilterRects.length; i++) {
        if (searchFilterRects[i].node() !== selectorRect.node()) {
            searchFilterRects[i].style("opacity", "0.5")
        } else {
            selectedFilterIndex = i
        }
    }
    // select all objects of class SELECTOR_MASK_CLASSNAME and remove them
    d3.selectAll("." + SELECTOR_MASK_CLASSNAME).remove()
    // remove selector text
    d3.select("div#chartId").selectAll("." + SELECTOR_TEXT_CLASSNAME).remove()
    drawFilterSelectorMask(selectorRect)
    drawFilterSelectorText(selectedFilterIndex)
}

function drawOuterLayerTexts(sliceSelectorDropdown, x0, y0, selectedFilter) {
    let sliceName = sliceSelectorDropdown.property("value")
    let outerLayerDropdown = d3.select("div#chartId")
        .append("select")
        .attr("name", "outerLayerSelector")
        .style("position", "absolute")
        .style("left", x0 + "px")
        .style("top", (y0 + 30) + "px")
        .attr("class", SELECTOR_TEXT_CLASSNAME + " " + OUTER_SEARCH_LAYER_CLASSNAME)
    let outerLayerIDs = [EMPTY_SELECTION_TEXT]
    for (let outerLayerID in SEARCH_PATTERNS[sliceSelectorDropdown.property("value")]) {
        outerLayerIDs.push(outerLayerID)
    }
    let outerLayerOptions = outerLayerDropdown.selectAll("option")
        .data(outerLayerIDs)
        .enter()
        .append("option")
        .text(function (d) {
            if (d === EMPTY_SELECTION_TEXT) {
                return d;
            } else {
                return getOuterLayer(sliceName, d)["label"];
            }
        })
        .attr("value", function (d) {
            return d;
        })

    if (selectedFilter.outer_layer_id == null) {
        outerLayerDropdown.property("value", EMPTY_SELECTION_TEXT)
    } else {
        outerLayerDropdown.property("value", selectedFilter.outer_layer_id)
        outerLayerDropdown.attr("title", getOuterLayer(sliceName, selectedFilter.outer_layer_id)["description"])
    }

    outerLayerDropdown.on("change", function () {
        d3.select("div#chartId").selectAll("." + INNER_SEARCH_LAYER_CLASSNAME).remove()
        selectedFilter.clearInnerLayers()
        let selectedOuterLayerID = outerLayerDropdown.property("value")
        if (selectedOuterLayerID === EMPTY_SELECTION_TEXT) {
            selectedFilter.clearOuterLayer()
            outerLayerDropdown.attr("title", null)
        } else {
            selectedFilter.outer_layer_id = selectedOuterLayerID
            drawInnerLayerTexts(selectedFilter)
            drawInnerLayerDropdown(selectedFilter)
            outerLayerDropdown.attr("title", getOuterLayer(sliceName, selectedOuterLayerID)["description"])
        }
    })

    return outerLayerDropdown;
}

function drawFilterSelectorText(selectedFilterIndex) {
    let selectedFilter = searchFilters[selectedFilterIndex]
    let x0 = searchWindowCanvas.node().getBoundingClientRect().x + 2 * SELECTOR_MASK_MARGIN + FILTER_SELECTOR_SIZE + 15
    let y0 = searchWindowCanvas.node().getBoundingClientRect().y + SELECTOR_MASK_MARGIN + 10

    if (searchFilters.length > 1) {
        createRemoveFilterButton(selectedFilterIndex)
    }

    // draw slice selector
    let sliceSelectionLabel = d3.select("div#chartId").append("text")
        .text("Object to apply the filter to:")
        .style("position", "absolute")
        .style("left", x0 + "px")
        .style("top", y0 + "px")
        .attr("class", SELECTOR_TEXT_CLASSNAME)
    let sliceSelectorDropdown = d3.select("div#chartId")
        .append("select")
        .attr("name", "sliceSelector")
        .style("position", "absolute")
        .style("left", (x0 + sliceSelectionLabel.node().getBoundingClientRect().width + 5) + "px")
        .style("top", y0 + "px")
        .attr("class", SELECTOR_TEXT_CLASSNAME)
    let slice_names = [EMPTY_SELECTION_TEXT]
    // add all in Object.keys(canvas_name_to_node_name_to_node_dict)
    for (let slice_name in canvas_name_to_node_name_to_node_dict) {
        slice_names.push(slice_name)
    }
    let options = sliceSelectorDropdown.selectAll("option")
        .data(slice_names)
        .enter()
        .append("option")
        .text(function (d) { return d; })
        .attr("value", function (d) { return d; })
    if (selectedFilter.slice_name == null) {
        sliceSelectorDropdown.property("value", EMPTY_SELECTION_TEXT)
    } else {
        sliceSelectorDropdown.property("value", selectedFilter.slice_name)
    }
    sliceSelectorDropdown.on("change", function () {
        // remove inner and outer layer texts and dropdowns
        d3.selectAll("." + INNER_SEARCH_LAYER_CLASSNAME).remove()
        d3.selectAll("." + OUTER_SEARCH_LAYER_CLASSNAME).remove()
        selectedFilter.outer_layer_id = null
        selectedFilter.inner_layer_ids = []
        if (sliceSelectorDropdown.property("value") !== EMPTY_SELECTION_TEXT) {
            selectedFilter.slice_name = sliceSelectorDropdown.property("value")
            drawOuterLayerTexts(sliceSelectorDropdown, x0, y0, selectedFilter);
        } else {
            selectedFilter.clearSliceName()
        }
    })

    // draw outer-layer selector
    if (sliceSelectorDropdown.property("value") !== EMPTY_SELECTION_TEXT) {
        let outerLayerDropdown = drawOuterLayerTexts(sliceSelectorDropdown, x0, y0, selectedFilter);

        // draw inner-layer selector(s)
        if (outerLayerDropdown.property("value") !== EMPTY_SELECTION_TEXT) {
            drawInnerLayerTexts(selectedFilter)
            drawInnerLayerDropdown(selectedFilter)
        }
    }

}

function drawInnerLayerTexts(searchFilter) {
    let x0 = searchWindowCanvas.node().getBoundingClientRect().x + 2 * SELECTOR_MASK_MARGIN + FILTER_SELECTOR_SIZE + 15
        + 25  // for indent
    let y0 = searchWindowCanvas.node().getBoundingClientRect().y + SELECTOR_MASK_MARGIN + 10 + 30

    for (let i in searchFilter.inner_layer_ids) {
        let y = y0 + 60 + 30 * i
        let uniqueInnerLayerID = searchFilter.inner_layer_ids[i]
        let innerLayerID = getInnerLayerIDFromUniqueID(uniqueInnerLayerID)
        let innerLayer = getInnerLayer(searchFilter.slice_name, searchFilter.outer_layer_id, innerLayerID)
        let x;
        if (i > 0) {
            let andLabel = d3.select("div#chartId").append("text")
                .text("and:")
                .style("position", "absolute")
                .style("left", x0 + "px")
                .style("top", y + "px")
                .attr("title", innerLayer["description"])
                .attr("class", SELECTOR_TEXT_CLASSNAME + " " + INNER_SEARCH_LAYER_CLASSNAME)
            x = x0 + andLabel.node().getBoundingClientRect().width + 5
        } else {
            x = x0
        }
        for (let j in innerLayer["label"]) {
            let innerLayerLabel = d3.select("div#chartId").append("text")
                .text(innerLayer["label"][j])
                .style("position", "absolute")
                .style("left", x + "px")
                .style("top", y + "px")
                .attr("title", innerLayer["description"])
                .attr("class", SELECTOR_TEXT_CLASSNAME + " " + INNER_SEARCH_LAYER_CLASSNAME)
            x += innerLayerLabel.node().getBoundingClientRect().width + 5
            // add editable field
            if (j < innerLayer["label"].length - 1) {
                let editableField = d3.select("div#chartId").append("textarea")
                    .attr("id", uniqueInnerLayerID + "_" + j)
                    .style("position", "absolute")
                    .style("left", x + "px")
                    .style("top", y + "px")
                    .style("resize", "none")
                    .attr("rows", 1)
                    .on("focus", function () {
                        this.rows = 5
                        d3.select(this).style("z-index", 1); // Raise the element using z-index
                    })
                    .on("blur", function () {
                        this.rows = 1
                        d3.select(this).style("z-index", "auto"); // Raise the element using z-index
                    })
                    .text(searchFilter.inner_layer_inputs[uniqueInnerLayerID][j])
                    .attr("title", innerLayer["description"])
                    .on("input", function () {
                        searchFilter.inner_layer_inputs[uniqueInnerLayerID][j] = this.value
                    })
                    .attr("class", SELECTOR_TEXT_CLASSNAME + " " + INNER_SEARCH_LAYER_CLASSNAME)
                x += editableField.node().getBoundingClientRect().width + 5
            }
        }
        // add delete button
        let deleteButton = d3.select("div#chartId").append("button")
            .text("x")
            .style("position", "absolute")
            .style("left", (searchWindowCanvas.node().getBoundingClientRect().right - 50) + "px")
            .style("top", y + "px")
            .on("click", function () {
                searchFilter.removeInnerLayer(uniqueInnerLayerID)
                d3.selectAll("." + INNER_SEARCH_LAYER_CLASSNAME).remove()
                drawInnerLayerTexts(searchFilter)
                drawInnerLayerDropdown(searchFilter)
            })
            .attr("class", SELECTOR_TEXT_CLASSNAME + " " + INNER_SEARCH_LAYER_CLASSNAME)
    }

}

function drawInnerLayerDropdown(searchFilter) {
    let sliceName = searchFilter.slice_name
    let outerLayerID = searchFilter.outer_layer_id
    let x0 = searchWindowCanvas.node().getBoundingClientRect().x + 2 * SELECTOR_MASK_MARGIN + FILTER_SELECTOR_SIZE + 15
        + 25  // for indent
    let y0 = searchWindowCanvas.node().getBoundingClientRect().y + SELECTOR_MASK_MARGIN + 10 + 30
    let y = y0 + 60 + 30 * searchFilter.inner_layer_ids.length

    let x;
    let gray = "#aaaaaa"
    if (searchFilter.inner_layer_ids.length > 0) {
        let andLabel = d3.select("div#chartId").append("text")
            .text("and:")
            .style("position", "absolute")
            .style("left", x0 + "px")
            .style("top", y + "px")
            // make text gray
            .style("color", gray)
            .attr("class", SELECTOR_TEXT_CLASSNAME + " " + INNER_SEARCH_LAYER_CLASSNAME)
        x = x0 + andLabel.node().getBoundingClientRect().width + 5
    } else {
        x = x0
    }
    let innerLayerDropdown = d3.select("div#chartId")
        .append("select")
        .attr("name", "innerLayerSelector")
        .style("position", "absolute")
        .style("left", x + "px")
        .style("top", y + "px")
        // make the whole thing gray
        .style("color", gray)
        .style("border-color", gray)
        .attr("class", SELECTOR_TEXT_CLASSNAME + " " + INNER_SEARCH_LAYER_CLASSNAME)
    let innerLayerIDs = [EMPTY_SELECTION_TEXT]
    for (let innerLayerID in getOuterLayer(sliceName, outerLayerID)["innerLayers"]) {
        innerLayerIDs.push(innerLayerID)
    }
    let innerLayerOptions = innerLayerDropdown.selectAll("option")
        .data(innerLayerIDs)
        .enter()
        .append("option")
        .text(function (d) {
            if (d === EMPTY_SELECTION_TEXT) {
                return d;
            } else {
                return getInnerLayer(sliceName, outerLayerID, d)["label"].join(" _ ");
            }
        })
        .attr("value", function (d) { return d; })
    // make text black during the selection process
    innerLayerDropdown.on("focus", function () {
        d3.select(this).style("color", "black")
    })
    innerLayerDropdown.on("blur", function () {
        d3.select(this).style("color", gray)
    })
    innerLayerDropdown.on("change", function () {
        searchFilter.addInnerLayer(this.value)
        d3.select("div#chartId").selectAll("." + INNER_SEARCH_LAYER_CLASSNAME).remove()
        drawInnerLayerTexts(searchFilter)
        drawInnerLayerDropdown(searchFilter)
    })
    innerLayerDropdown.property("value", EMPTY_SELECTION_TEXT)
}

function getOuterLayer(sliceName, outerLayerID) {
    return SEARCH_PATTERNS[sliceName][outerLayerID]
}

function getInnerLayer(sliceName, outerLayerID, innerLayerID) {
    return SEARCH_PATTERNS[sliceName][outerLayerID]["innerLayers"][innerLayerID]
}

function onSearchIconClick() {
    if (!searchWindowVisible) {
        createSearchWindowContainer();

        createSearchWindowCanvas();

        for (let i = 0; i < searchFilters.length; i++) {
            searchFilterRects[i] = createFilterSelectorRect(i)
        }

        createAddFilterButton()

        selectSelectorRect(searchFilterRects[0]);

        drawSearchNowButton();

    } else {
        searchFilterRects = []
        searchWindowVisible = false
        searchWindowContainer.remove()
        d3.select("div#chartId").selectAll("." + SELECTOR_TEXT_CLASSNAME).remove()
        d3.select("div#chartId").selectAll("." + "searchNowButton").remove()
    }
}

function clearSearch() {
    if (searchWindowVisible) {
        onSearchIconClick()  // remove the search window
    }
    searchFilters = []
    addEmptySearchFilter()
    sio.emit("clear_search")
}

function drawSearchNowButton() {
    let width = 120
    let height = 33
    let r = searchWindowCanvas.node().getBoundingClientRect()
    let x = r.right - width - 15
    let y = r.bottom - height - 15
    let searchNowButton = d3.select("div#chartId").append("button")
        .text("Search Now")
        .style("position", "absolute")
        .style("left", x + "px")
        .style("top", y + "px")
        .style("width", width + "px")
        .style("height", height + "px")
        // round the corners
        .style("border-radius", "5px")
        .on("click", function () {
            performSearch(true)
        })
        .attr("class", "searchNowButton")
    // make the button stand out a bit more
    searchNowButton.style("background-color", "white")
    searchNowButton.style("border-color", "black")
    searchNowButton.style("color", "black")
    // make it bold and larger font
    // searchNowButton.style("font-weight", "bold")
    searchNowButton.style("font-size", "16px")

}

function performSearch(doCloseWindow) {
    if (isSearchLegal()) {
        let searchFiltersToTransmit = []
        for (let i = 0; i < searchFilters.length; i++) {
            searchFiltersToTransmit.push(searchFilters[i].getTransmissibleDict(FILTER_COLORS[i % FILTER_COLORS.length]))
        }
        sio.emit("perform_search", searchFiltersToTransmit)
        if (doCloseWindow) {
            onSearchIconClick()  // little hack to make the search window disappear
        }
    } else {
        // notfiy user that search is not legal
        alert("Search is not legal. Please make sure that each search filter has at least one search pattern fully selected.")
    }
}

function isSearchLegal() {
    for (let i = 0; i < searchFilters.length; i++) {
        if (searchFilters[i].slice_name == null || searchFilters[i].outer_layer_id == null
            || searchFilters[i].inner_layer_ids.length == 0) {
            return false
        }
    }
    return true
}

function drawXLine(x1, x2, y) {
    if (x1 < x2) {
        drawLine(x1, y, x2, y, SELECTOR_MASK_ROUNDING, 0)
    }
    // else the line has "negative length" and we don't draw it.
}

function drawYLine(x, y1, y2) {
    if (y1 < y2) {
        drawLine(x, y1, x, y2, 0, SELECTOR_MASK_ROUNDING)
    }
    // else the line has "negative length" and we don't draw it.
}



function drawLine(x1, y1, x2, y2, xShortening, yShortening) {
    // assumes that x2 >= x1 and y2 >= y1
    x1 = x1 + xShortening
    x2 = x2 - xShortening
    y1 = y1 + yShortening
    y2 = y2 - yShortening
    searchWindowCanvas.append("line")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("stroke", BORDER_COLOR)
        .attr("stroke-width", 2)
        .attr("class", SELECTOR_MASK_CLASSNAME)
}


function drawCornerTopRight(xCorner, yCorner) {
    drawCorner(xCorner, yCorner, -SELECTOR_MASK_ROUNDING, 0, 0, SELECTOR_MASK_ROUNDING)
}

function drawCornerBottomRight(xCorner, yCorner) {
    drawCorner(xCorner, yCorner, 0, -SELECTOR_MASK_ROUNDING, -SELECTOR_MASK_ROUNDING, 0)
}

function drawCornerBottomLeft(xCorner, yCorner) {
    drawCorner(xCorner, yCorner, SELECTOR_MASK_ROUNDING, 0, 0, -SELECTOR_MASK_ROUNDING)
}

function drawCornerTopLeft(xCorner, yCorner) {
    drawCorner(xCorner, yCorner, 0, SELECTOR_MASK_ROUNDING, SELECTOR_MASK_ROUNDING, 0)
}


function drawCorner(xCorner, yCorner, xOffsetIn, yOffsetIn, xOffsetOut, yOffsetOut) {
    let edge = d3.path()
    let x1 = xCorner + xOffsetIn
    let y1 = yCorner + yOffsetIn
    let x2 = xCorner + xOffsetOut
    let y2 = yCorner + yOffsetOut
    edge.moveTo(x1, y1)
    edge.bezierCurveTo(xCorner, yCorner, xCorner, yCorner, x2, y2)
    searchWindowCanvas.append("path")
        .attr("d", edge)
        .attr("stroke", BORDER_COLOR)
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .attr("class", SELECTOR_MASK_CLASSNAME)
}

function getInnerLayerIDFromUniqueID(uniqueID) {
    return uniqueID.split("_bsdfe_uniquefier_fafswee_")[0]
}

function makeUniqueInnerLayerID(innerLayerID) {
    return innerLayerID + "_bsdfe_uniquefier_fafswee_" + create_alias()
}

class FilterInfo {
    constructor(slice_name, outer_layer_id, unique_inner_layer_ids, inner_layer_inputs=undefined) {
        this.slice_name = slice_name
        this.outer_layer_id = outer_layer_id
        this.inner_layer_ids = unique_inner_layer_ids
        if (inner_layer_inputs === undefined) {
            this.inner_layer_inputs = {}  // maps inner layer id to list of input values
            for (let i in unique_inner_layer_ids) {
                let inner_layer_ID = getInnerLayerIDFromUniqueID(unique_inner_layer_ids[i])
                let inner_label = getInnerLayer(slice_name, outer_layer_id, inner_layer_ID)["label"]
                this.inner_layer_inputs[unique_inner_layer_ids[i]] = []
                for (let j = 0; j< inner_label.length -1; j++) {
                    this.inner_layer_inputs[unique_inner_layer_ids[i]].push("")
                }
            }
        } else {
            this.inner_layer_inputs = inner_layer_inputs
        }
    }

    addInnerLayer(inner_layer_id) {
        let unique_id = makeUniqueInnerLayerID(inner_layer_id)
        this.inner_layer_ids.push(unique_id)
        this.inner_layer_inputs[unique_id] = []
        let inner_label = getInnerLayer(this.slice_name, this.outer_layer_id, inner_layer_id)["label"]
        for (let j = 0; j< inner_label.length -1; j++) {
            this.inner_layer_inputs[unique_id].push("")
        }
        return unique_id
    }

    clearInnerLayers() {
        this.inner_layer_ids = []
        this.inner_layer_inputs = {}
    }

    removeInnerLayer(unique_inner_layer_id) {
        let index = this.inner_layer_ids.indexOf(unique_inner_layer_id)
        if (index > -1) {
            this.inner_layer_ids.splice(index, 1)
        }
        delete this.inner_layer_inputs[unique_inner_layer_id]
    }

    clearOuterLayer() {
        this.outer_layer_id = null
        this.clearInnerLayers()
    }

    clearSliceName() {
        this.slice_name = null
        this.clearOuterLayer()
    }

    getTransmissibleDict(color) {
        let dict = {}
        dict["slice_name"] = this.slice_name
        dict["outer_layer_id"] = this.outer_layer_id
        let inner_layer_ids = []
        for (let i in this.inner_layer_ids) {
            inner_layer_ids.push(getInnerLayerIDFromUniqueID(this.inner_layer_ids[i]))
        }
        dict["inner_layer_ids"] = inner_layer_ids
        let inner_layer_inputs = []
        for (let i in this.inner_layer_ids) {
            let inner_layer_input = this.inner_layer_inputs[this.inner_layer_ids[i]]
            inner_layer_inputs.push(inner_layer_input)
        }
        dict["inner_layer_inputs"] = inner_layer_inputs
        dict["color"] = color
        return dict
    }
}