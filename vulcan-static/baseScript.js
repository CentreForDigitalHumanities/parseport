// Apart from removing console.log statements, and the change below, the JS
// files are unchanged compared to those in the original Vulcan repo.

// Original:
// const sio = io();

// Modified:
const sio = io({
    query: {
        id: window.location.pathname.split("/").pop()
    }
});

// sio.eio.pingTimeout = 120000; // 2 minutes
// sio.eio.pingInterval = 20000;  // 20 seconds

// https://stackoverflow.com/questions/16265123/resize-svg-when-window-is-resized-in-d3-js
// let canvas = create_canvas(100, 10)
// let canvas2 = create_canvas(30, 10)
// let canvas3 = create_canvas(30, 10)

const canvas_dict = {}
const canvas_name_to_node_name_to_node_dict = {}

let current_corpus_position = 0
let corpus_length = 0
let saved_layout = null

const window_width  = window.innerWidth || document.documentElement.clientWidth ||
document.body.clientWidth;
const window_height = window.innerHeight|| document.documentElement.clientHeight||
document.body.clientHeight;

var current_mouseover_node = null
var current_mouseover_canvas = null
var current_mouseover_label_alternatives = null
var currently_showing_label_alternatives = false
const linker_dropdowns = {}

function create_canvas(width_percent, height_percent, name="", only_horizontal_zoom=false) {
    // console.log("input width_percent ", width_percent)
    let canvas_width = width_percent*window_width/100
    // console.log("original canvas_width ", canvas_width)
    let canvas_height = window_height * height_percent/100

    let container = d3.select("div#chartId")
      .append("div")
      .attr("class","layoutDiv")
      .style("width", width_percent + "%")
      .style("padding-bottom", height_percent + "%")
      // .style("border", "3px dotted red")
      .classed("svg-container", true)
      .style("position", "relative") // Add position property to the container div
      // .style("padding-bottom", "3px") // Add padding to the bottom to make room for the border
      //       .style("padding", "0px")
            // .style("padding-right", "0px")

    // console.log("container width "+container.node().getBoundingClientRect().width)

    let canvas_gap = 16 // that's 3 + 3 for the borders. The canvas is 10px down due to the css file. 10px less width adds a horizontal margin
    let canvas = container.append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", "0 0 " + (canvas_width - canvas_gap) + " " + (canvas_height - canvas_gap))  // TODO this scales the image, with currently unintended consequences (strings are too small)
      // .attr("viewPort", "0 0 " + (canvas_width-16) + " " + (canvas_height-16))  // TODO this scales the image, with currently unintended consequences (strings are too small)
      .attr("width", "calc(100% - " + canvas_gap + "px)")
      .attr("height", "calc(100% - " + canvas_gap + "px)")
      .classed("svg-content-responsive", true)
      .style("background-color", "#eeeeee")
      .style("border", "3px solid black")
      //   .style("box-shadow", "0px 0px 0px 10px black inset")
            .style("padding-left", "0px")
            .style("padding-right", "0px")
      .call(d3.zoom().on("zoom", function ()
      {
        // Transform the 'g' element when zooming
        // as per "update vor v4" in https://coderwall.com/p/psogia/simplest-way-to-add-zoom-pan-on-d3-js
        // console.log(d3.event.transform)
        // let actual_transform = {
        //     x: d3.event.transform.x,
        //     y: d3.event.transform.y,
        //     k: d3.event.transform.k
        // }
        if (only_horizontal_zoom) {
            d3.event.transform.y = 0
        }
        d3.select(this).select("g").attr("transform", d3.event.transform);
      }))

    // console.log("canvas width after creation "+canvas.node().getBoundingClientRect().width)


    if (name !== "") {
        // we need to store the canvas position here, because adding the text_div can change the canvas position
        // once we move the text_div to the right position, the canvas will be back in place.
        // a similar issue happens when adding a canvas creates a scrollbar. All previously created canvases will
        // move, but their slice name labels will not move with them.
        let canvas_right = canvas.node().getBoundingClientRect().right
        let canvas_top = canvas.node().getBoundingClientRect().top
        let text_div = d3.select("div#chartId").append("div")
            .attr("class", "removeOnReset")
            .style("position", "absolute") // Add position property to the text div
            // .style("top", "10px") // Set position relative to the container div
            // .style("right", "10px") // Set position relative to the container div
            .style("color", "black")
            .style("font-size", "20px")
            .style("background-color", "#FFFFFF")
            .style("border", "3px solid black")
            // add margin
            .style("padding", "10px")
            .text(name);

        // Position the text relative to the SVG element
        // let svgRect = container.node().getBoundingClientRect(); // Get the bounding box of the SVG element
        // console.log(width_percent)
        // let canvas_width = canvas.attr("width")// window_width * width_percent/100.0
        // console.log("canvas width at end "+canvas_width)
        // console.log("canvas right at end "+canvas.node().getBoundingClientRect().right)
        // use the -100 for a placeholder of the name for now.
        // get width of the text_div
        let text_div_width = text_div.node().getBoundingClientRect().width
        let dx = canvas_right - text_div_width; // Calculate the distance from the right edge of the SVG element
        let dy = canvas_top; // Calculate the distance from the top edge of the SVG element
        text_div.style("top", dy + "px") // Set the position of the text element
            .style("left", dx + "px") // Set the position of the text element
            // .style("right", (canvas_width)+"px")


        // // Append a new 'rect' element to the SVG element
        // let rect = text_div.append("rect")
        // .attr("rx", 10)
        // .attr("ry", 10)
        // .attr("x", 0)
        // .attr("y", 0)
        // .attr("width", 100)
        // .attr("height", 20)
        // .attr("fill", "white")
        // .attr("stroke", "black")
        // .attr("stroke-width", 2)
    }

    addFilterDefinitions(canvas);

    let g = canvas.append("g")
    return g
}


d3.select("#previousButton")
    .on("click", function() {
        if (set_corpus_position(current_corpus_position - 1)) {
            sio.emit("instance_requested", current_corpus_position);
        }
    });

d3.select("#nextButton")
    .on("click", function() {
        if (set_corpus_position(current_corpus_position + 1)) {
            sio.emit("instance_requested", current_corpus_position);
        }
    });

d3.select("#searchButton")
    .on("click", function() {
      onSearchIconClick()
    });

d3.select("#clearSearchButton")
    .on("click", function() {
      clearSearch()
    });

sio.on('connect', () => {
    // console.log('connected');
    initializeSearchFilters()
});

sio.on('disconnect', () => {
//   console.log('disconnected');
});

sio.on('set_show_node_names', (data) => {
    add_node_name_to_node_label = data["show_node_names"]
})

sio.on("set_graph", (data) => {
    let canvas = canvas_dict[data["canvas_name"]]
    remove_graphs_from_canvas(canvas)
    let label_alternatives = null
    if ("label_alternatives_by_node_name" in data) {
        label_alternatives = data["label_alternatives_by_node_name"]
    }
    let highlights = null
    if ("highlights" in data) {
        highlights = data["highlights"]
    }
    let mouseover_texts = null
    if ("mouseover_texts" in data) {
        mouseover_texts = data["mouseover_texts"]
    }
    let graph = new Graph(20, 20, data["graph"], canvas, true, 0,
        label_alternatives, highlights, mouseover_texts)
    graph.registerNodesGlobally(data["canvas_name"])
})

sio.on("set_table", (data) => {
    let canvas = canvas_dict[data["canvas_name"]]
    remove_strings_from_canvas(canvas)
    let label_alternatives = null
    if ("label_alternatives_by_node_name" in data) {
        label_alternatives = data["label_alternatives_by_node_name"]
    }
    let highlights = null
    if ("highlights" in data) {
        highlights = data["highlights"]
        // console.log(highlights)
    }
    let dependency_tree = null
    if ("dependency_tree" in data) {
        dependency_tree = data["dependency_tree"]
    }
    let table = new Table(20, 5, data["table"], canvas, label_alternatives, highlights,
        dependency_tree)
    table.registerNodesGlobally(data["canvas_name"])
})

var alignment_color_scale = d3.scaleLinear().range(['white','#0742ac']);  // just kinda experimenting

sio.on("set_linker", (data) => {
    let canvas_name1 = data["name1"]
    let canvas_name2 = data["name2"]
    // get arbitrary score from the linker
    let nn1 = Object.keys(data["scores"])[0]
    let nn2 = Object.keys(data["scores"][nn1])[0]
    let score = data["scores"][nn1][nn2]
    if (isNaN(score)) {
        // then score must be a list or a table
        let is_table = isNaN(score[0])
        let headcount
        let layercount = score.length
        if (is_table) {
            headcount = score[0].length
        } else {
            headcount = 0
        }
        create_linker_dropdown(canvas_name1, canvas_name2, headcount, layercount)
    }
    for (let node_name1 in data["scores"]) {
        for (let node_name2 in data["scores"][node_name1]) {
            let score = data["scores"][node_name1][node_name2]
            let node1 = canvas_name_to_node_name_to_node_dict[canvas_name1][node_name1]
            let node2 = canvas_name_to_node_name_to_node_dict[canvas_name2][node_name2]
            let whitespaceRegex = /\s/g
            // console.log(linker_dropdowns)
            // console.log(linker_dropdowns[[canvas_name1, canvas_name2]])
            let dropdown = linker_dropdowns[[canvas_name1, canvas_name2]]
            // console.log(dropdown_value)
            register_mousover_alignment(node1, node2, score,
                (canvas_name1+"_"+node_name1+"_"+canvas_name2+"_"+node_name2).replace(whitespaceRegex, "_"),
                dropdown)
            register_mousover_alignment(node2, node1, score,
                (canvas_name2+"_"+node_name2+"_"+canvas_name1+"_"+node_name1).replace(whitespaceRegex, "_"),
                dropdown)
        }
    }
})

function create_linker_dropdown(canvas_name1, canvas_name2, headcount, layercount) {
    let label = d3.select("div#headerId").append("text")
        .text("Linker " + canvas_name1 +"/" + canvas_name2)
        .attr("class", "removeOnReset")
        .style("margin-left", "10px")
    let dropdown = d3.select("div#headerId")
        .append("select")
        .attr("name", canvas_name1+canvas_name2+"Selector")
        .attr("class", "removeOnReset")
        .style("margin-left", "5px")

    let option_values = []
    option_values.push(["all"])
    for (let i = 0; i < layercount; i++) {
        option_values.push(["layer", i])
        for (let j = 0; j < headcount; j++) {  // this actually makes the case distinction between table and list autmatically
            option_values.push(["layer+head", i, j])
        }
    }

    dropdown.selectAll("option")
        .data(option_values)
        .enter()
        .append("option")
        .text(function (d) {
            if (d[0] == "all") {
                return "All layers (and heads)"
            } else if (d[0] == "layer") {
                return "Layer " + (d[1] + 1)
            } else if (d[0] == "layer+head") {
                return "Layer " + (d[1] + 1) + ", Head " + (d[2] + 1)
            }
        })
        .attr("value", function (d) { return d; })

    dropdown.property("value", ["all"])

    linker_dropdowns[[canvas_name1, canvas_name2]] = dropdown
}

function register_mousover_alignment(mouseover_node, aligned_node, score, linker_id, dropdown) {
    mouseover_node.rectangle.on("mouseover.align_"+linker_id, function() {
                // check if score is a number
                if (isNaN(score)) {
                    // then score must be a list or table of numbers
                    let dropdown_value
                    if (dropdown != null) {
                        dropdown_value = dropdown.property("value").split(",")
                    } else {
                        console.log("Unexpectedly, no dropdown menu value was given for complex alignment. Using default value 'all'.")
                        dropdown_value = ["all"]
                    }
                    if (isNaN(score[0])) {
                        // then we have a table
                        if (dropdown_value[0] == "all") {
                            let table = []
                            for (let i = 0; i < score.length; i++) {
                                let table_row = []
                                for (let j = 0; j < score[i].length; j++) {
                                    table_row.push(alignment_color_scale(Math.pow(score[i][j], 0.75)))
                                }
                                table.push(table_row)
                            }
                            aligned_node.setColor(table)
                        } else if (dropdown_value[0] == "layer") {
                            let list = []
                            for (let i = 0; i < score[parseInt(dropdown_value[1])].length; i++) {
                                list.push(alignment_color_scale(Math.pow(score[parseInt(dropdown_value[1])][i], 0.75)))
                            }
                            aligned_node.setColor(list)
                        } else if (dropdown_value[0] == "layer+head") {
                            aligned_node.setColor(alignment_color_scale(Math.pow(score[parseInt(dropdown_value[1])][parseInt(dropdown_value[2])], 0.75)))
                        }
                    } else {
                        // then we have a list of numbers
                        if (dropdown_value[0] == "all") {
                            let list = []
                            for (let i = 0; i < score.length; i++) {
                                // wrap in list to stack layers on top of each other, not left to right
                                list.push([alignment_color_scale(Math.pow(score[i], 0.75))])
                            }
                            aligned_node.setColor(list)
                        } else if (dropdown_value[0] == "layer") {
                            aligned_node.setColor(alignment_color_scale(Math.pow(score[parseInt(dropdown_value[1])], 0.75)))
                        }
                    }
                } else {
                    // then score is just a single number
                    aligned_node.setColor(alignment_color_scale(Math.pow(score, 0.75)))  // just kinda experimenting
                }
            })
            .on("mouseout.align_"+linker_id, function() {
                aligned_node.setColor(aligned_node.baseFillColors)
            })
}

sio.on("set_layout", (layout) => {
    saved_layout = layout
    corpus_length = layout[0][0].length
    set_layout(layout)
})

function set_layout(layout) {
    let canvas_heights = []
    layout.forEach(row => {
        let height_here = 0
        row.forEach(slice => {
            let vis_type = slice["visualization_type"]
            if (vis_type == "STRING") {
                height_here = Math.max(height_here, 15)
            } else {
                height_here = Math.max(height_here, 100)
            }
        })
        height_here = height_here * (1 - 0.2 * (row.length - 1))  // make rows with many entries a bit smaller,
            // for a more balanced feel.
        canvas_heights.push(height_here)
    })
    // normalize the heights
    let total_height = canvas_heights.reduce((a, b) => a + b, 0)
    for (let i = 0; i < canvas_heights.length; i++) {
        let normalization_divisor = Math.max(total_height, 100)  // to make a single string row not too big
        canvas_heights[i] = 45 * canvas_heights[i] / normalization_divisor  // TODO the 45 should probably depend on
            // TODO the screen height or something
    }
    for (let i = 0; i < layout.length; i++) {
        let row = layout[i]
        let height = canvas_heights[i]
        row.forEach(slice => {
            canvas_dict[slice["name"]] = create_canvas(99/row.length, height, name=slice["name"],
                only_horizontal_zoom = slice["visualization_type"] == "STRING")

        })
    }
}

function reset() {
    d3.selectAll(".layoutDiv").remove()
    d3.selectAll(".removeOnReset").remove()
}

sio.on("set_corpus_length", (data) => {
    corpus_length = data;
    set_corpus_position(current_corpus_position)
})

sio.on("search_completed", (data) => {
    set_corpus_position(0)
    sio.emit("instance_requested", current_corpus_position);
})

sio.on("refresh_to_position_zero", (data) => {
    set_corpus_position(0)
    sio.emit("instance_requested", current_corpus_position);
})

sio.on("set_search_filters", (data) => {
    SEARCH_PATTERNS = data
})

sio.on("server_error", (data) => {
    alert("Error on the server side. If you experience issues, please try reloading the page.")
})

function remove_graphs_from_canvas(canvas) {
    canvas.selectAll("."+NODE_CLASSNAME+", ."+BACKGROUND_CLASSNAME+", ."+EDGE_CLASSNAME).remove()
}

function remove_strings_from_canvas(canvas) {
    canvas.selectAll("."+TOKEN_CLASSNAME).remove()
}

function set_corpus_position(new_position) {
    if (new_position >= 0 && new_position < corpus_length) {
        current_corpus_position = new_position
        document.getElementById("corpusPositionInput").value = current_corpus_position + 1
        d3.select("#corpusPositionText").text("/" + corpus_length)
        reset()
        set_layout(saved_layout)
        return true
    } else {
        if (corpus_length == 0) {
            // TODO maybe show some message that the search was empty, or that the corpus is empty.
            reset()
            document.getElementById("corpusPositionInput").value = 0
            d3.select("#corpusPositionText").text("/" + corpus_length)
        }
        return false
    }
}

d3.select("body").on("keydown", function () {
    // keyCode of alt key is 18
    if (d3.event.keyCode == 17) {
        if (current_mouseover_node != null && !currently_showing_label_alternatives) {
            show_label_alternatives(current_mouseover_node,
                current_mouseover_label_alternatives,
                current_mouseover_canvas)
            currently_showing_label_alternatives = true
        }
    } else if (d3.event.keyCode == 13) {
        if (searchWindowVisible) {
            performSearch(true)
        }
    }
});

d3.select("body").on("keyup", function () {
    // keyCode of alt key is 18
    if (d3.event.keyCode == 17) {
        if (current_mouseover_node != null && currently_showing_label_alternatives) {
            hide_label_alternatives(current_mouseover_canvas)
            currently_showing_label_alternatives = false
        }
    }
});

d3.select("#corpusPositionInput").on("keypress", function() {
    if (d3.event.keyCode == 13) {
        let new_position = parseInt(d3.select("#corpusPositionInput").property("value")) - 1
        if (set_corpus_position(new_position)) {
            sio.emit("instance_requested", current_corpus_position)
        } else {
            d3.select("#corpusPositionText").text("/" + corpus_length + " Error: invalid position requested")
        }
        return true
    }
})



function addFilterDefinitions(canvas) {
    let defs = canvas.append("defs")

    // blur
    defs.append("filter")
        .attr("id", "blur")
        .append("feGaussianBlur")
        .attr("stdDeviation", 2);

    // cutting color in, inspired by https://css-tricks.com/adding-shadows-to-svg-icons-with-css-and-svg-filters/
    // and syntax inspired by https://stackoverflow.com/questions/12277776/how-to-add-drop-shadow-to-d3-js-pie-or-donut-chart
    let filter = defs.append("filter")
        .attr("id", "white-border-inset")

    filter.append("feOffset")
        .attr("in", "SourceAlpha")
        .attr("dx", 0)
        .attr("dy", 0)
        .attr("result", "offset")
    filter.append("feGaussianBlur")
        .attr("in", "SourceGraphic")
        .attr("stdDeviation", 1.5)
        .attr("result", "offsetBlur");
    filter.append("feComposite")
        .attr("operator", "out")
        .attr("in", "SourceGraphic")
        .attr("in2", "offsetBlur")
        .attr("result", "inverse");
    filter.append("feFlood")
        .attr("flood-color", "white")
        .attr("flood-opacity", "1.0")
        .attr("result", "color");
    filter.append("feComposite")
        .attr("operator", "in")
        .attr("in", "color")
        .attr("in2", "inverse")
        .attr("result", "shadow");
    filter.append("feComposite")
        .attr("operator", "over")
        .attr("in", "shadow")
        .attr("in2", "SourceGraphic")
        .attr("result", "final");
    filter.append("feComposite")
        .attr("in", "offsetColor")
        .attr("in2", "offsetBlur")
        .attr("operator", "in")
        .attr("result", "offsetBlur");
    //
    // let feMerge = filter.append("feMerge");
    //
    // feMerge.append("feMergeNode")
    //     .attr("in", "offsetBlur")
    // feMerge.append("feMergeNode")
    //     .attr("in", "SourceGraphic");

    // dropshadow, see https://stackoverflow.com/questions/12277776/how-to-add-drop-shadow-to-d3-js-pie-or-donut-chart
    // let filter = defs.append("filter")
    //     .attr("id", "dropshadow")
    //
    // filter.append("feGaussianBlur")
    //     .attr("in", "SourceAlpha")
    //     .attr("stdDeviation", 4)
    //     .attr("result", "blur");
    // filter.append("feOffset")
    //     .attr("in", "blur")
    //     .attr("dx", 2)
    //     .attr("dy", 2)
    //     .attr("result", "offsetBlur")
    // filter.append("feFlood")
    //     .attr("in", "offsetBlur")
    //     .attr("flood-color", "#3d3d3d")
    //     .attr("flood-opacity", "0.5")
    //     .attr("result", "offsetColor");
    // filter.append("feComposite")
    //     .attr("in", "offsetColor")
    //     .attr("in2", "offsetBlur")
    //     .attr("operator", "in")
    //     .attr("result", "offsetBlur");
    //
    // let feMerge = filter.append("feMerge");
    //
    // feMerge.append("feMergeNode")
    //     .attr("in", "offsetBlur")
    // feMerge.append("feMergeNode")
    //     .attr("in", "SourceGraphic");


    //   <filter id='inset-shadow'>
    //   <!-- Shadow offset -->
    //   <feOffset
    //           dx='0'
    //           dy='0'></feOffset>
    //   <!-- Shadow blur -->
    // <feGaussianBlur
    //           stdDeviation='1'
    //           result='offset-blur'></feGaussianBlur>
    //   <!-- Invert drop shadow to make an inset shadow-->
    //   <feComposite
    //           operator='out'
    //           in='SourceGraphic'
    //           in2='offset-blur'
    //           result='inverse'></feComposite>
    //   <!-- Cut colour inside shadow -->
    //   <feFlood
    //           flood-color='black'
    //           flood-opacity='.95'
    //           result='color'></feFlood>
    //   <feComposite
    //           operator='in'
    //           in='color'
    //           in2='inverse'
    //           result='shadow'></feComposite>
    //   <!-- Placing shadow over element -->
    //   <feComposite
    //           operator='over'
    //           in='shadow'
    //           in2='SourceGraphic'></feComposite>
    // </filter>
}
