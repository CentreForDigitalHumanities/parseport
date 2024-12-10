NODE_BUFFER_WIDTH = 50
NODE_LEVEL_HEIGHT = 100
HEIGHT_SWITCH_BUFFER = 6
BACKGROUND_CLASSNAME = "backgroundbox"
EDGE_CLASSNAME = "edge"
EDGE_COLOR = "#000080"
REENTRANT_EDGE_COLOR = "#7777FF"

let add_node_name_to_node_label = false


function child_is_above_parent(edge_position_data) {
    return edge_position_data.parentNode.getY() > edge_position_data.childNode.getY() + edge_position_data.childNode.getHeight() + HEIGHT_SWITCH_BUFFER;
}

function child_is_below_parent(edge_position_data) {
    return edge_position_data.childNode.getY() > edge_position_data.parentNode.getY() + edge_position_data.parentNode.getHeight() + HEIGHT_SWITCH_BUFFER;
}

function edge_is_sideways(edge_position_data) {
    return !(child_is_below_parent(edge_position_data) || child_is_above_parent(edge_position_data));
}

class Graph {

    constructor(top_left_x, top_left_y, graph_as_dict, canvas, draw_boundary_box=true, margin=0,
                node_label_alternatives_by_node_name=null, highlights=null, mouseover_texts=null) {
        this.margin = margin
        this.node_dict = {};
        this.box_position_dict = {};
        this.graph_as_dict = graph_as_dict
        this.canvas = canvas
        this.node_label_alternatives_by_node_name = node_label_alternatives_by_node_name
        this.highlights = highlights
        this.mouseover_texts = mouseover_texts
        this.create_all_nodes()
        this.compute_node_positions(top_left_x, top_left_y)
        if (false) { //draw_boundary_box) {
            this.draw_boundary_box(top_left_x, top_left_y)
        }
        this.draw_graph()
    }

    compute_node_positions(top_left_x, top_left_y) {
        this.set_total_widths_bottom_up()
        this.set_positions_top_down(top_left_x, top_left_y)
    }

    draw_graph() {
        this.shift_nodes_to_their_positions()
        this.drawEdges()
    }

    static visit_graph_as_dict_bottom_up(subgraph_as_dict, visitor) {
        let results = []
        subgraph_as_dict["child_nodes"].forEach(child => {
            results.push(Graph.visit_graph_as_dict_bottom_up(child, visitor))
        })
        return visitor(subgraph_as_dict, results)
    }

    recenter(new_width) {
        // don't need to to anything here.
    }

    static visit_graph_as_dict_top_down(subgraph_as_dict, visitor) {
        visitor(subgraph_as_dict)
        subgraph_as_dict["child_nodes"].forEach(child => {
            Graph.visit_graph_as_dict_top_down(child, visitor)
        })
    }

    set_total_widths_bottom_up() {
        this.total_widths_dict = {};
        Graph.visit_graph_as_dict_bottom_up(this.graph_as_dict, (current_node, child_widths) => {
                if (current_node.is_reentrancy) {
                    return -NODE_BUFFER_WIDTH; // to compensate for the NODE_BUFFER_WIDTH we add for each child, could be cleaner
                } else {
                    let width_here = child_widths.reduce((a, b) => a + b, 0) + NODE_BUFFER_WIDTH * (child_widths.length - 1);
                    width_here = Math.max(width_here, this.node_dict[current_node.node_name].getWidth())
                    this.total_widths_dict[current_node.node_name] = width_here
                    return width_here
                }
            })
    }

    set_positions_top_down(top_left_x, top_left_y) {
        let root_node_name = this.graph_as_dict.node_name
        this.box_position_dict[root_node_name] = {x: top_left_x + this.margin, y: top_left_y + this.margin}
        // set values for all children
        Graph.visit_graph_as_dict_top_down(this.graph_as_dict, (current_node) => {
            if (!current_node.is_reentrancy) {
                let current_node_x = this.box_position_dict[current_node.node_name].x
                let current_node_y = this.box_position_dict[current_node.node_name].y
                let running_child_width_total = 0
                current_node["child_nodes"].forEach(child => {
                    if (!child.is_reentrancy) {
                        let child_width = this.total_widths_dict[child.node_name]
                        this.box_position_dict[child.node_name] = {
                            x: current_node_x + running_child_width_total, // left border position
                            y: current_node_y + this.node_dict[current_node.node_name].getHeight() + NODE_BUFFER_WIDTH
                        }
                        running_child_width_total += child_width + NODE_BUFFER_WIDTH
                    }
                })
            }
        })
    }

    create_all_nodes() {
        Graph.visit_graph_as_dict_top_down(this.graph_as_dict, (current_node) => {
            if (!current_node.is_reentrancy) {
                let label = current_node.node_label
                if (add_node_name_to_node_label && current_node.label_type === "STRING") {
                    label = current_node.node_name + " / " + label
                }
                let is_bold = current_node.node_name === this.graph_as_dict.node_name
                let node_object = createNode(0, 0, label, current_node.label_type, this.canvas, is_bold,
                    graphNodeDragged)
                let do_highlight = this.highlights != null && current_node.node_name in this.highlights
                if (do_highlight) {
                    node_object.setColor(this.highlights[current_node.node_name])
                }
                this.node_dict[current_node.node_name] = node_object
                this.registerNodeMouseoverNodeHighlighting(node_object)
                if (this.node_label_alternatives_by_node_name != null) {
                    this.registerNodeAlternativeMouseover(node_object,
                        this.node_label_alternatives_by_node_name[current_node.node_name])
                }
                if (this.mouseover_texts != null && this.mouseover_texts[current_node.node_name] != null) {
                    this.registerMouseoverTextEvent(node_object,
                        this.mouseover_texts[current_node.node_name])
                }
            }
        })
    }

    shift_nodes_to_their_positions() {
        Graph.visit_graph_as_dict_top_down(this.graph_as_dict, (current_node) => {
            if (!current_node.is_reentrancy) {
                let y = this.box_position_dict[current_node.node_name].y
                let x = this.get_centered_left_border_for_node(current_node)
                this.node_dict[current_node.node_name].translate(x,y)
            }
        })
    }

    get_centered_left_border_for_node(node_as_dict) {
        let left_box_border = this.box_position_dict[node_as_dict.node_name].x
        let box_width= this.total_widths_dict[node_as_dict.node_name]
        let node_width = this.node_dict[node_as_dict.node_name].getWidth()
        return left_box_border + (box_width / 2) - (node_width / 2)
    }

    getWidth() {
        // console.log("graph width" + this.total_widths_dict[this.graph_as_dict.node_name] + 2 * this.margin)
        return this.total_widths_dict[this.graph_as_dict.node_name] + 2 * this.margin
    }

    getHeight() {
        return this.getBottomY() - this.box_position_dict[this.graph_as_dict.node_name].y + 2 * this.margin
    }

    getBottomY() {
        let allBottomYs = []
        Object.keys(this.node_dict).forEach(node_name => {
            allBottomYs.push(this.box_position_dict[node_name].y + this.node_dict[node_name].getHeight())
        })
        return Math.max(...allBottomYs)
    }

    draw_boundary_box(top_left_x, top_left_y) {
        const arr = Object.keys( this.box_position_dict )
            .map(key => this.box_position_dict[key].y + this.node_dict[key].getHeight());
        const height = Math.max.apply( null, arr ) - top_left_y;
        // draw white box around graph with NODE_BUFFER_WIDTH as margin
        this.canvas.append("rect")
            .attr("x", top_left_x - NODE_BUFFER_WIDTH - 200)
            .attr("y", top_left_y - NODE_BUFFER_WIDTH - 150)
            .attr("width", this.total_widths_dict[this.graph_as_dict.node_name] + 2 * NODE_BUFFER_WIDTH + 400)
            .attr("height",  height + 2 * NODE_BUFFER_WIDTH + 300)
            .attr("fill", "white")
            .attr("class", BACKGROUND_CLASSNAME)
            .lower()
        // inner box showing actual boundaries (no margin)
        // this.canvas.append("rect")
        //     .attr("x", top_left_x)
        //     .attr("y", top_left_y)
        //     .attr("width", this.total_widths_dict[this.graph_as_dict.node_name])
        //     .attr("height",  height)
        //     .attr("fill", '#eeeeee')
    }

    drawEdges() {
        Graph.visit_graph_as_dict_top_down(this.graph_as_dict, currentNode => {
            currentNode.child_nodes.forEach(child => {
                let edge_position_data = this.get_edge_position_data(currentNode, child)
                let edge_object = this.draw_edge_from_data(edge_position_data);
                let edge_label_object = this.draw_edge_label_from_data(edge_position_data);
                this.registerEdgeMouseover(edge_object, edge_label_object)
                this.registerNodeMouseoverEdgeHighlighting(this.node_dict[currentNode.node_name], edge_object, edge_label_object)
                this.registerNodeMouseoverEdgeHighlighting(this.node_dict[child.node_name], edge_object, edge_label_object)
                this.node_dict[currentNode.node_name].registerGraphEdge(edge_object, edge_label_object, edge_position_data, this)
                this.node_dict[child.node_name].registerGraphEdge(edge_object, edge_label_object, edge_position_data, this)
            })
        })
    }

    get_edge_position_data(current_node, child_node) {
        // check if edge label ends with "-of"
        if (child_node.incoming_edge.endsWith("-of")) {
            return {
                    parentNode: this.node_dict[child_node.node_name],
                    childNode: this.node_dict[current_node.node_name],
                    edge_label: child_node.incoming_edge.slice(0, -3),
                    is_reentrancy: child_node.is_reentrancy,
                    parentBoxWidth: this.total_widths_dict[child_node.node_name],
                    childBoxWidth: this.total_widths_dict[current_node.node_name]
                }
        } else {
            return {
                parentNode: this.node_dict[current_node.node_name],
                childNode: this.node_dict[child_node.node_name],
                edge_label: child_node.incoming_edge,
                is_reentrancy: child_node.is_reentrancy,
                parentBoxWidth: this.total_widths_dict[current_node.node_name],
                childBoxWidth: this.total_widths_dict[child_node.node_name]
            }
        }
    }

    draw_edge_label_from_data(edge_position_data) {
        let color = edge_position_data.is_reentrancy ? REENTRANT_EDGE_COLOR : EDGE_COLOR
        return this.canvas.append("text").data([edge_position_data])
            .text(d => d.edge_label)
            .attr("x", d => this.getEdgeLabelXFromData(d))
            .attr("y", d => this.getEdgeLabelYFromData(d))
            .style("font-size", "9px")
            .style('fill', color)
            // .style("pointer-events", "none")
            .style("user-select", "none")
            .attr("class", EDGE_CLASSNAME)
    }

    EDGE_LABEL_CLOSE_RANGE = 100
    EDGE_LABEL_FAR_RANGE = 350

    getEdgeLabelXFromData(edge_position_data) {
        let p = edge_position_data.parentNode
        let c = edge_position_data.childNode
        let distance = c.getX() + c.getWidth()/2 - p.getX() - p.getWidth()/2 // negative if child is to the left
        if (distance < -this.EDGE_LABEL_FAR_RANGE) {
            // child is far to the left, we put label above edge close to child
            if (edge_is_sideways(edge_position_data)) {
                return c.getX() + c.getWidth() + 20
            } else {
                return (c.getX() + c.getWidth()/2)
            }
        } else if (distance < -this.EDGE_LABEL_CLOSE_RANGE) {
            //child is medium to the left, we put label below middle of edge
            return (p.getX() + p.getWidth()/2 + c.getX() + c.getWidth()/2)/2-10 // -10 compensates to quasi-center text
        } else if (distance < this.EDGE_LABEL_CLOSE_RANGE) {
            // child is nearly centered, we put label left of middle of edge
            return (p.getX() + p.getWidth()/2 + c.getX() + c.getWidth()/2)/2 + 10  + distance/3 // + 10 just to get a bit of distance
        } else if (distance < this.EDGE_LABEL_FAR_RANGE) {
            // child is medium to the right, we put label above middle of edge
            return (p.getX() + p.getWidth()/2 + c.getX() + c.getWidth()/2)/2+5
        } else {
            // child is far to the right, we put label above edge close to child
            if (edge_is_sideways(edge_position_data)) {
                return c.getX() - 10 - Node.get_hypothetical_node_width(edge_position_data.edge_label)
            } else {
                return (c.getX() + c.getWidth()/2)-20
            }
        }
    }

    getEdgeLabelYFromData(edge_position_data) {
        let p = edge_position_data.parentNode
        let c = edge_position_data.childNode
        let yShift = 0
        if (edge_position_data.is_reentrancy && !childIsBelowParent(edge_position_data)) {
            yShift = 50
        }
        let baseY;
        let distance = c.getX() + c.getWidth()/2 - p.getX() - p.getWidth()/2 // negative if child is to the left
        if (distance < -this.EDGE_LABEL_FAR_RANGE) {
            // child is far to the left, we put label above edge close to child
            if (edge_is_sideways(edge_position_data)) {
                baseY = c.getY() - 5
            } else {
                baseY = c.getY() - 25
            }
        } else if (distance < -this.EDGE_LABEL_CLOSE_RANGE) {
            //child is medium to the left, we put label below middle of edge
            baseY = (p.getY() + p.getHeight() + c.getY()) / 2 + 20 - 0.2*(c.getY()-p.getY()) // +20 to be below center
        } else if (distance < this.EDGE_LABEL_CLOSE_RANGE) {
            // child is nearly centered, we put label left of middle of edge
            baseY = (p.getY() + p.getHeight() + c.getY()) / 2
        } else if (distance < this.EDGE_LABEL_FAR_RANGE) {
            // child is medium to the right, we put label above middle of edge
            baseY = (p.getY() + p.getHeight() + c.getY()) / 2 - 12 - 0.18*(c.getY()-p.getY()) // -20 to be above center
        } else {
            // child is far to the right, we put label above edge close to child
            if (edge_is_sideways(edge_position_data)) {
                baseY = c.getY() - 5
            } else {
                baseY = c.getY() - 25
            }
        }
        return baseY + yShift
    }

    draw_edge_from_data(edge_position_data) {
        let color = edge_position_data.is_reentrancy ? REENTRANT_EDGE_COLOR : EDGE_COLOR
        return this.canvas.append("path").data([edge_position_data])
            .attr("shape-rendering", "geometricPrecision")
            .style("stroke", color)
            .style("stroke-width", 1.5)
            .style("fill", "none")
            .attr("marker-end", marker(color, this.canvas))
            .attr("d", d => this.getEdgePathFromData(d))
            .attr("class", EDGE_CLASSNAME)
    }

    registerEdgeMouseover(edge_object, edge_label_object) {
        this.registerEdgeHighlightingOnObjectMouseover(edge_object, edge_object, edge_label_object)
        this.registerEdgeHighlightingOnObjectMouseover(edge_label_object, edge_object, edge_label_object)
    }

    registerEdgeHighlightingOnObjectMouseover(object, edge_object, edge_label_object, stroke_width=4) {
        object.on("mouseover.edge"+create_alias(), function() {
                edge_object.style("stroke-width", stroke_width)
                edge_label_object.style("font-size", "15px")
                edge_label_object.style("font-weight", "bold")
            })
            .on("mouseout.edge"+create_alias(), function() {
                edge_object.style("stroke-width", 1.5)
                edge_label_object.style("font-size", "9px")
                edge_label_object.style("font-weight", "normal")
            })
    }

    registerNodeHighlightingOnObjectMouseover(object, node_object) {
        let current_stroke_width = parseInt(node_object.rectangle.style("stroke-width"))
        let bold_stroke_width = current_stroke_width + 2
        object.on("mouseover", function() {
                node_object.rectangle.style("stroke-width", bold_stroke_width)
            })
            .on("mouseout", function() {
                node_object.rectangle.style("stroke-width", current_stroke_width)
            })
    }

    registerNodeAlternativeMouseover(node_object, node_label_alternatives) {
        let graph_object = this
        node_object.rectangle.on("mouseover.node_alternative", function() {
                current_mouseover_node = node_object
                current_mouseover_canvas = graph_object.canvas
                current_mouseover_label_alternatives = node_label_alternatives
            // check if alt key is currently pressed
                if (d3.event.ctrlKey) {
                    show_label_alternatives(node_object, node_label_alternatives, graph_object.canvas)
                }
            })
            .on("mouseout.node_alternative", function() {
                current_mouseover_node = null
                current_mouseover_canvas = null
                current_mouseover_label_alternatives = null
                if (d3.event.ctrlKey) {
                    hide_label_alternatives(graph_object.canvas)
                }
            })
        // this below does not seem to be working
            // .on("keydown.node_alternative", function() {
            //     if (d3.event.keyCode == 18) {
            //         show_label_alternatives(node_object, null, graph_object.canvas)
            //     }
            // })
            // .on("keyup.node_alternative", function() {
            //     if (d3.event.keyCode == 18) {
            //         hide_label_alternatives(graph_object.canvas)
            //     }
            // })
    }

    registerMouseoverTextEvent(node_object, node_label_alternatives) {
        let graph_object = this
        node_object.rectangle.on("mouseover.mouseover_text", function() {
                show_mouseover_text(node_object, node_label_alternatives, graph_object.canvas)
            })
            .on("mouseout.mouseover_text", function() {
                hide_mouseover_text(graph_object.canvas)
            })
    }

    registerNodeMouseoverNodeHighlighting(node_object) {
        this.registerNodeHighlightingOnObjectMouseover(node_object.rectangle, node_object)
    }


    registerNodeMouseoverEdgeHighlighting(node_object, edge_object, edge_label_object) {
        this.registerEdgeHighlightingOnObjectMouseover(node_object.rectangle, edge_object, edge_label_object, 3)
    }

    getEdgePathFromData(edge_position_data) {
        if (edge_position_data.is_reentrancy) {
            let startpoint = this.getReentrancyStartPoint(edge_position_data)
            let endpoint = this.getReentrancyEndPoint(edge_position_data)
            let edge = d3.path()
            edge.moveTo(startpoint.x, startpoint.y)
            if (childIsBelowParent(edge_position_data)) {
                let verticalCenter = (startpoint.y+endpoint.y) / 2
                edge.bezierCurveTo(startpoint.x, verticalCenter, endpoint.x, startpoint.y, endpoint.x, endpoint.y)
            } else {
                edge.bezierCurveTo(startpoint.x, startpoint.y + NODE_LEVEL_HEIGHT / 2,
                    endpoint.x, endpoint.y + NODE_LEVEL_HEIGHT / 2,
                    endpoint.x, endpoint.y)
            }
            return edge
        } else {
            let startpoint = this.getEdgeStartPoint(edge_position_data)
            let endpoint = this.getEdgeEndPoint(edge_position_data)
            let edge = d3.path()
            edge.moveTo(startpoint.x, startpoint.y)
            if (edge_is_sideways(edge_position_data)) {
                let horizontal_center = (startpoint.x + endpoint.x) / 2
                edge.bezierCurveTo(horizontal_center, startpoint.y, horizontal_center, endpoint.y, endpoint.x, endpoint.y)
            } else {
                let verticalCenter = (startpoint.y + endpoint.y) / 2
                edge.bezierCurveTo(startpoint.x, verticalCenter, endpoint.x, startpoint.y, endpoint.x, endpoint.y)
            }
            return edge
        }
    }




    getEdgeStartPoint(edge_position_data) {
        let xDistRatio = getXDistRatio(edge_position_data.parentNode, edge_position_data.childNode, edge_position_data.parentBoxWidth)
        let x
        let default_x = edge_position_data.parentNode.getX() + edge_position_data.parentNode.getWidth() * 0.8 * sigmoid(xDistRatio)
        let y
        if (child_is_above_parent(edge_position_data)) {
            y = edge_position_data.parentNode.getY()
            x = default_x
        } else if (child_is_below_parent(edge_position_data)) {
            y = edge_position_data.parentNode.getY() + edge_position_data.parentNode.getHeight()
            x = default_x
        } else {
            y = edge_position_data.parentNode.getY() + 0.5 * edge_position_data.parentNode.getHeight()
            if (edge_position_data.parentNode.getX() < edge_position_data.childNode.getX()) {
                x = edge_position_data.parentNode.getX() + edge_position_data.parentNode.getWidth()
            } else {
                x = edge_position_data.parentNode.getX()
            }
        }
        return {
            x: x,
            y: y
        }
    }

    getEdgeEndPoint(edge_position_data) {
        let x
        let default_x = edge_position_data.childNode.getX() + 0.5 * edge_position_data.childNode.getWidth()
        let y
        if (child_is_above_parent(edge_position_data)) {
            y = edge_position_data.childNode.getY() + edge_position_data.childNode.getHeight()
            x = default_x
        } else if (child_is_below_parent(edge_position_data)) {
            y = edge_position_data.childNode.getY()
            x = default_x
        } else {
            y = edge_position_data.childNode.getY() + 0.5 * edge_position_data.childNode.getHeight()
            if (edge_position_data.parentNode.getX() < edge_position_data.childNode.getX()) {
                x = edge_position_data.childNode.getX()
            } else {
                x = edge_position_data.childNode.getX() + edge_position_data.childNode.getWidth()
            }
        }
        return {
            x: x,
            y: y
        }
    }


    getReentrancyStartPoint(edge_position_data) {
        let xDistRatio = getXDistRatio(edge_position_data.parentNode, edge_position_data.childNode, this.getWidth()*2)
        return {
            x: edge_position_data.parentNode.getX() + edge_position_data.parentNode.getWidth() * 0.8 * sigmoid(xDistRatio),
            y: edge_position_data.parentNode.getY() + edge_position_data.parentNode.getHeight()
        }
    }

    getReentrancyEndPoint(edge_position_data) {
        let xDistRatio = getXDistRatio(edge_position_data.childNode, edge_position_data.parentNode, this.getWidth()*2)
        let endPointX = edge_position_data.childNode.getX() + edge_position_data.childNode.getWidth() * 0.8 * sigmoid(xDistRatio)
        if (childIsBelowParent(edge_position_data)) {
            return {
                x: endPointX,
                y: edge_position_data.childNode.getY()
            }
        } else {
            return {
                x: endPointX,
                y: edge_position_data.childNode.getY() + edge_position_data.childNode.getHeight()
            }
        }
    }




    registerNodesGlobally(canvas_name) {
        let dict_here = {}
        for (let node_name in this.node_dict) {
            dict_here[node_name] = this.node_dict[node_name]
        }
        canvas_name_to_node_name_to_node_dict[canvas_name] = dict_here
    }


}

function getXDistRatio(mainNode, referenceNode, normalizingFactor) {
    return (referenceNode.getX()+referenceNode.getWidth()/2 - mainNode.getX() - mainNode.getWidth()/2)/normalizingFactor
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}


function childIsBelowParent(edge_position_data) {
    return edge_position_data.childNode.getY() >
        edge_position_data.parentNode.getY()+edge_position_data.parentNode.getHeight()
}

function graphNodeDragged(d) {
    // console.log(node_object.registeredEdges.length)
    d.x += d3.event.dx;
    d.y += d3.event.dy;
    let registeredEdges = ALL_NODES[d3.select(this).data()[0].id].registeredEdges
    for (let i = 0; i < registeredEdges.length; i++) {
        let edge = registeredEdges[i][0]
        let edge_label = registeredEdges[i][1]
        let edge_position_data = registeredEdges[i][2]
        let graph = registeredEdges[i][3]
        edge.attr("d", d => graph.getEdgePathFromData(edge_position_data))
        edge_label.attr("x", d => graph.getEdgeLabelXFromData(edge_position_data))
                  .attr("y", d => graph.getEdgeLabelYFromData(edge_position_data))
    }
    // console.log(registeredEdges.length)
    d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")");
}

let alias = 0
function create_alias() {
    alias += 1
    return alias
}
