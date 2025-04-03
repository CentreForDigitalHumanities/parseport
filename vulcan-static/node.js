const NODE_CLASSNAME = "node"
const GRAPH_LABEL_MARGIN = 20

const SHADOW_OVERSIZE = 2

const ALL_NODES = {}

let UNIQUE_NODE_COUNTER = 0

class Node {
    constructor(node_position, group, rectangle, content, border_color, shadow) {
        this.position = node_position[0]
        this.group = group
        this.rectangle = rectangle
        this.content = content
        this.border_color = border_color
        this.rectangle.attr("stroke", border_color)
        this.shadow = shadow
        this.baseFillColors = "white"
        this.currentFillColors = "white"

        // for debugging: draw a boundary rectangle
        // this.group.append("rect")
        //     .attr("x", -2)
        //     .attr("y", -2)
        //     .attr("width", this.getWidth()+4)
        //     .attr("height", this.getHeight()+4)
        //     .attr("stroke", "red")
        //     .attr("stroke-width", 2)
        //     .attr("fill-opacity", 0.0)

        // console.log("mask_rect_" + this.position.id)
        this.mask_rect = this.group.append("defs").append("clipPath")
            .attr("id", "mask_rect_" + this.position.id)
            .append("rect")
            .attr("rx", this.rectangle.attr("rx"))
            .attr("ry", this.rectangle.attr("ry"))
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.getWidth())
            .attr("height", this.getHeight())
            // .attr("x", -200)
            // .attr("y", -200)
            // .attr("width", 400)
            // .attr("height", 400)
            .attr("class", this.rectangle.attr("class"))
        this.setColor(this.currentFillColors)
        // get absolute position on page
        // console.log("constructor " + this.position.id)
        // console.log(this.group.select(".color_rect").node().getBoundingClientRect().x)
        // console.log(this.mask_rect.node().getBoundingClientRect().x)
        // console.log(this.rectangle.node().getBoundingClientRect().x)
        this.registeredEdges = []
    }

    translate(x, y) {
        // this.group.attr("transform", "translate(" + x + "," + y + ")")
        this.position.x = x
        this.position.y = y
        this.group.attr("transform", "translate(" + this.position.x + "," + this.position.y + ")")
        // this.mask_rect.attr("transform", "translate(" + this.position.x + "," + this.position.y + ")")
        // console.log("translate " + this.position.id)
        // console.log(this.group.select(".color_rect").node().getBoundingClientRect().x)
        // console.log(this.mask_rect.node().getBoundingClientRect().x)
        // console.log(this.rectangle.node().getBoundingClientRect().x)
    }

    getWidth() {
        return parseFloat(this.rectangle.attr("width"))
    }

    setWidth(width) {
        this.rectangle.attr("width", width)
        this.content.recenter(width)
        if (this.shadow != null) {
            this.shadow.attr("width", width + 2*SHADOW_OVERSIZE)
        }
        this.mask_rect.attr("width", width)
        this.setColor(this.currentFillColors) // need to update the size of the color rects
    }

    static get_hypothetical_node_width(node_label) {
        // if (isNaN(node_label.length*6.5 + 22)) {
        //     console.log("node_label length is NaN: " + node_label)
        // }
        let text_width = this.getTextWidth(node_label)
        return Math.max(30, text_width + 20)
    }

    static getTextWidth(text) {

        let text_object = document.createElement("span");
        document.body.appendChild(text_object);

        // text.style.font = "times new roman";
        // text.style.fontSize = 16 + "px";
        text_object.style.height = 'auto';
        text_object.style.width = 'auto';
        text_object.style.position = 'absolute';
        text_object.style.whiteSpace = 'no-wrap';
        text_object.innerHTML = make_html_safe(text);


        let width = Math.ceil(text_object.clientWidth);

        document.body.removeChild(text_object);

        return width
    }

    getHeight() {
        return parseFloat(this.rectangle.attr("height"))
    }

    setHeight(height) {
        this.rectangle.attr("height", height)
        // this.content.recenter(height)
        if (this.shadow != null) {
            this.shadow.attr("height", height + 2*SHADOW_OVERSIZE)
        }
        this.mask_rect.attr("height", height)
        this.setColor(this.currentFillColors) // need to update the size of the color rects
    }

    getX() {
        return this.position.x
    }

    getY() {
        return this.position.y
    }

    registerGraphEdge(edge, edge_label, edge_position_data, graph) {
        this.registeredEdges.push([edge, edge_label, edge_position_data, graph])
    }

    registerDependencyEdge(edge, is_outgoing, label, table) {
        this.registeredEdges.push([edge, is_outgoing, label, table])
    }

    setColor(colors) {
        this.currentFillColors = colors
        this.group.selectAll(".color_rect").remove()
        // check if colors is an Array
        if (Array.isArray(colors)) {
            if (colors.length === 0) {
                this.setColor("white")
            } else {
                if (Array.isArray(colors[0])) {
                    // then we have a table of colors
                    for (let r = 0; r < colors.length; r++) {
                        if (colors[r].length === 0) {
                            this.createColorRect("white", r, 0, colors.length, 1)
                        } else {
                            for (let c = 0; c < colors[r].length; c++) {
                                this.createColorRect(colors[r][c], r, c, colors.length, colors[r].length)
                            }
                        }
                    }
                } else {
                    // then we have a list of colors, and we use them left to right
                    for (let c = 0; c < colors.length; c++) {
                        this.createColorRect(colors[c], 0, c, 1, colors.length)
                    }
                }
            }
        } else {
            this.createColorRect(colors, 0, 0, 1, 1)
        }

        if (this.shadow != null) {
            this.shadow.lower()
        }
        // console.log("setColor " + this.position.id)
        // console.log(this.group.select(".color_rect").node().getBoundingClientRect().x)
        // console.log(this.mask_rect.node().getBoundingClientRect().x)
        // console.log(this.rectangle.node().getBoundingClientRect().x)
    }

    setBaseColors(colors) {
        this.baseFillColors = colors
    }

    getBaseColors() {
        return this.baseFillColors
    }

    createColorRect(color, r, c, num_rows, num_cols) {
        let widths = this.getWidth() / num_cols
        let heights = this.getHeight() / num_rows
        this.group.append("rect")
            .attr("x", c * widths)
            .attr("y", r * heights)
            .attr("width", widths)
            .attr("height", heights)
            .attr("fill", color)
            .attr("clip-path", "url(#mask_rect_" + this.position.id + ")")
            // set class
            .attr("class", this.rectangle.attr("class") + " color_rect")
            .lower()
    }

}

function create_and_register_node_object(node_position, node_group, rect, content_object, border_color,
                                         shadow=null) {
    let node_object = new Node(node_position, node_group, rect, content_object, border_color, shadow)

    ALL_NODES[node_position[0].id] = node_object

    return node_object;
}

function getNodePosition(x, y) {
    pos = [{x: x, y: y, id: UNIQUE_NODE_COUNTER}];
    UNIQUE_NODE_COUNTER += 1
    return pos
}

function makeNodeGroup(canvas, node_position, classname) {
    return canvas.data(node_position).append("g")
        .attr("transform", function (d) {
            // console.log("makeNodeGroup translate(" + d.x + "," + d.y + ")")
            return "translate(" + d.x + "," + d.y + ")";
        })
        .attr("class", classname);
}

function makeNodeRectangle(is_bold, node_group, content_object, classname) {
    let stroke_width = is_bold ? "4" : "2"

    let fill = "white"

    return node_group.append("rect")
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", content_object.getWidth())
        .attr("height", content_object.getHeight())
        .attr("fill", fill)
        .attr("fill-opacity", 0.0)  // fill comes from Node#setColor()
        .attr("stroke-width", stroke_width)
        .attr("class", classname)
        // .lower();
}

function makeCellRectangle(is_bold, node_group, content_object, classname) {
    if (is_bold) {
        console.log("Warning: Cell was marked as bold, but this is currently not possible.")
    }

    let stroke_width = "0"

    let fill = "white"

    return node_group.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", content_object.getWidth())
        .attr("height", content_object.getHeight())
        .attr("fill", fill)
        .attr("stroke-width", stroke_width)
        .attr("class", classname)
        .attr("fill-opacity", 0.0)
        .lower();
}

function makeCellShadow(node_group, content_object, classname) {

    return node_group.append("rect")
        .attr("x", -SHADOW_OVERSIZE)
        .attr("y", -SHADOW_OVERSIZE)
        .attr("width", content_object.getWidth() + 2 * SHADOW_OVERSIZE)
        .attr("height", content_object.getHeight() + 2 * SHADOW_OVERSIZE)
        .attr("fill", "#cccccc")
        // .attr("fill", "green")
        .attr("stroke-width", "0")
        .attr("class", classname)
        // blur
        .attr("filter", "url(#white-border-inset)")
        .lower();
}


function createNode(x, y, content_data, content_type, canvas, is_bold,
                    drag_function=null, classname=NODE_CLASSNAME) {

    return createNodeWithBorderColor(x, y, content_data, content_type, canvas, is_bold, "black",
                    drag_function, classname);

}

function createNodeWithBorderColor(x, y, content_data, content_type, canvas, is_bold, border_color,
                                   drag_function, classname=NODE_CLASSNAME) {

    let node_position = getNodePosition(x, y);

    let node_group = makeNodeGroup(canvas, node_position, classname)

    let content_object = createNodeContent(content_data, content_type, node_group, classname)

    let rect = makeNodeRectangle(is_bold, node_group, content_object, classname);

    if (drag_function != null) {
        let nodeDragHandler = d3.drag().on('drag', drag_function);
        nodeDragHandler(node_group);
    }

    let node = create_and_register_node_object(node_position, node_group, rect, content_object, border_color);

    node.setColor("white")

    return node

}

function createCell(x, y, content_data, content_type, canvas, is_bold, classname=NODE_CLASSNAME) {

    let node_position = getNodePosition(x, y);


    let node_group = makeNodeGroup(canvas, node_position, classname)

    let content_object = createNodeContent(content_data, content_type, node_group, classname)

    let rect = makeCellRectangle(is_bold, node_group, content_object, classname)

    let shadow = makeCellShadow(node_group, content_object, classname)

    let cell = create_and_register_node_object(node_position, node_group, rect, content_object, "black",
        shadow)

    return cell

}




function createNodeContent(content_data, content_type, append_to_this_object, classname) {

    if (content_type === "STRING") {
        if (content_data == null) {
            content_data = ""
        } else {
            content_data = content_data.toString()
        }
        let rect_width = Node.get_hypothetical_node_width(content_data);
        let rect_height = 30;
        let text_object = append_to_this_object.append("text")
            .attr("text-anchor", "middle")
            .attr("x", rect_width/2)
            .attr("y", rect_height/2)
            .attr("dy", ".3em")
            .style("pointer-events", "none")
            .attr("class", classname)
            .text(content_data)
        // console.log("content_data: " + content_data)
        return new NodeStringContent(text_object, rect_width, rect_height)
    } else if (content_type === "GRAPH" || content_type === "TREE") {
        return new Graph(0, 0, content_data, append_to_this_object, false,
            GRAPH_LABEL_MARGIN)
    }

}

class NodeStringContent {
    constructor(text_object, width, height) {
        this.text_object = text_object
        this.width = width
        this.height = height
    }

    recenter(new_width) {
        this.width = new_width
        this.text_object.attr("x", new_width/2)
    }

    getWidth() {
        return this.width
    }

    getHeight() {
        return this.height
    }
}
