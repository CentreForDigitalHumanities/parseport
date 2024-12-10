const TOKEN_CLASSNAME = "token_obj"
const TOKEN_DISTANCE = 5
const MAX_DEPTREE_HEIGHT = 10
const MIN_DEPLABEL_CELL_DIST = 20
const MIN_DEPLABEL_DEPLABEL_DIST = 15
const MAX_DEPEDGES_OVERLAPPING = 1
const DEP_LEVEL_DISTANCE = 40
const DEP_TREE_BASE_Y_OFFSET = 40
const NODE_ID_TO_XY_BOX = {}

function makeRandomDependencyEdgeColor() {
    let random_addition = Math.random()
    let blue = 0.2 + 0.8 * random_addition
    let red = 0.4 * random_addition
    let green = 0.1 + 0.5 * random_addition
    return "#"+turnToRBG(red)+turnToRBG(green)+turnToRBG(blue)
}

function turnToRBG(value) {
    let ret = Math.floor(value*255).toString(16)
    while (ret.length < 2) {
        ret = "0"+ret
    }
    return ret
}

function getReproducibleRandomNumberFromLabel(label) {
    return mulberry32(1000*label[0] + label[1])()
}

function mulberry32(a) {
    // see https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

class Table {
    constructor(top_left_x, top_left_y, content, canvas, label_alternatives, highlights, dependency_tree) {
        this.top_left_x = top_left_x
        this.top_left_y = top_left_y
        this.cells = []
        this.canvas = canvas
        this.label_alternatives = label_alternatives
        this.highlights = highlights
        this.dependency_tree = dependency_tree
        this.create_cells(content)
        this.create_dependency_tree()
    }

    create_cells(content) {
        let current_x = this.top_left_x
        let current_y = this.top_left_y
        // We do the rows such that the first row is at the bottom, because this is more intuitive for the tagging
        //  scenario
        for (let c = 0; c < content.length; c++) {
            let cells_in_column = []
            let column = content[c]
            let max_width = 0
            let cells_here = []
            for (let r = column.length-1; r >= 0 ; r--) {
                let cell_here = this.create_cell_node(column[r], current_x, current_y, this.getCellName(c, r))
                cells_here.push(cell_here)
                current_y = current_y + parseFloat(cell_here.getHeight()) + TOKEN_DISTANCE
                let width_here = parseFloat(cell_here.getWidth())
                max_width = Math.max(max_width, width_here)
                cells_in_column.push(cell_here)
            }
            this.cells.push(cells_in_column)
            // set all widths to max_width
            for (let i = 0; i < cells_here.length; i++) {
                cells_here[i].setWidth(max_width)
            }
            current_y = this.top_left_y
            current_x = current_x + max_width + TOKEN_DISTANCE
        }

        // realign vertically
        let cumulative_max_heights = 0
        for (let r = 0; r < this.cells[0].length; r++) {
            let max_height = 0
            for (let c = 0; c < this.cells.length; c++) {
                let cell_here = this.cells[c][r]
                let height_here = parseFloat(cell_here.getHeight())
                max_height = Math.max(max_height, height_here)
            }
            for (let c = 0; c < this.cells.length; c++) {
                let cell_here = this.cells[c][r]
                cell_here.setHeight(max_height)
                cell_here.translate(cell_here.getX(), this.top_left_y + cumulative_max_heights)
            }
            cumulative_max_heights += max_height + TOKEN_DISTANCE
        }
    }

    getCellName(column, row) {
        return "("+row+", "+column+")"  // mimic python's tuple notation, i.e. what you get for str((row, column))
    }

    create_cell_node(token, pos_x, pos_y, node_name) {
        // let node = createNode(pos_x, pos_y, token, "STRING", this.canvas, false, null, TOKEN_CLASSNAME)
        // check if token is a string
        let node;
        if (typeof token === 'string' || token instanceof String) {
            node = createCell(pos_x, pos_y, token, "STRING", this.canvas, false, TOKEN_CLASSNAME)
        } else {
            node = createCell(pos_x, pos_y, token[1], token[0], this.canvas, false, TOKEN_CLASSNAME)
        }
        let do_highlight = this.highlights != null && node_name in this.highlights
        if (do_highlight) {
            node.setColor(this.highlights[node_name])
        } else {
            node.setColor("white")
        }
        this.register_mouseover_highlighting(node)
        if (this.label_alternatives != null && node_name in this.label_alternatives) {
            this.registerNodeAlternativeMouseover(node, this.label_alternatives[node_name])
        }
        return node
    }

    create_dependency_tree() {
        // console.log(this.label_alternatives)
        if (this.dependency_tree != null) {
            // sort edges in dependency tree by absolute distance between head and tail, shortest distance first
            this.dependency_tree.sort(function(a, b) {
                let distance_a = Math.abs(a[0] - a[1])
                let distance_b = Math.abs(b[0] - b[1])
                return distance_a - distance_b
            })
            let edge_count_at_position = []
            let label_at_position = []
            // position i, j is (i+1)-st level above the table, and between token j and j+1.
            for (let i = 0; i <= MAX_DEPTREE_HEIGHT; i++) {
                let edge_counts_in_this_level = []
                for (let j = 0; j < this.dependency_tree.length - 1; j++) {
                    edge_counts_in_this_level.push(0)
                }
                edge_count_at_position.push(edge_counts_in_this_level)
                let labels_in_this_level = []
                for (let j = 0; j < this.dependency_tree.length - 1; j++) {
                    labels_in_this_level.push(null)
                }
                label_at_position.push(labels_in_this_level)
            }
            let max_level_here = 0
            let total_min_y = 0
            for (let i = 0; i < this.dependency_tree.length; i++) {
                let edge = this.dependency_tree[i]
                let head = edge[0]
                let tail = edge[1]
                let label = edge[2]

                if (head >= 0) {
                    let min_bound = Math.min(head, tail)
                    let max_bound = Math.max(head, tail)

                    let found_position = false
                    let current_level = 0
                    while (!found_position) {
                        let max_edge_count = 0;
                        for (let k = min_bound; k < max_bound; k++) {
                            max_edge_count = Math.max(max_edge_count, edge_count_at_position[current_level][k])
                        }
                        if (max_edge_count >= MAX_DEPEDGES_OVERLAPPING && !(current_level === MAX_DEPTREE_HEIGHT - 1)) {
                            current_level++
                            continue
                        }
                        let available_label_slots = []
                        for (let k = min_bound; k < max_bound; k++) {
                            if (label_at_position[current_level][k] == null) {
                                available_label_slots.push(k)
                            }
                        }
                        if (available_label_slots.length === 0) {
                            if (!(current_level === MAX_DEPTREE_HEIGHT - 1)) {
                                current_level++
                                continue
                            } else {
                                available_label_slots = [min_bound]
                            }
                        }
                        found_position = true
                        // choose the label slot that is closest to the center of the edge
                        let best_label_slot = this.find_slot_closest_to_center(available_label_slots,
                                                                           min_bound, max_bound);
                        max_level_here = Math.max(max_level_here, current_level)
                        for (let k = min_bound; k < max_bound; k++) {
                            edge_count_at_position[current_level][k]++
                        }
                        let y = -DEP_TREE_BASE_Y_OFFSET-current_level*DEP_LEVEL_DISTANCE
                        let color = makeRandomDependencyEdgeColor()
                        let dependency_label_node = createNodeWithBorderColor(
                            40 + best_label_slot*60,
                            y, label, "STRING", this.canvas,
                            false, color, dependencyTreeNodeDragged)
                        let depedge_name = "depedge_"+head+"_"+tail
                        if (this.label_alternatives != null && depedge_name in this.label_alternatives) {
                            this.registerNodeAlternativeMouseover(dependency_label_node, this.label_alternatives[depedge_name])
                        }
                        label_at_position[current_level][best_label_slot] = [head, tail, dependency_label_node]
                        total_min_y = Math.min(total_min_y, y)
                    }

                }


            }
            for (let i = 0; i < this.dependency_tree.length; i++) {
                let edge = this.dependency_tree[i]
                let head = edge[0]
                let tail = edge[1]
                let label = edge[2]
                if (head === -1) {
                    let y = -DEP_TREE_BASE_Y_OFFSET-(max_level_here + 1)*DEP_LEVEL_DISTANCE
                    let color = makeRandomDependencyEdgeColor()
                    let root_label_node =  createNodeWithBorderColor(
                        40 + (tail - 0.5) *60,
                        y, label, "STRING", this.canvas,
                        false, color, dependencyTreeNodeDragged)
                    let depedge_name = "depedge_"+head+"_"+tail
                    if (this.label_alternatives != null && depedge_name in this.label_alternatives) {
                        this.registerNodeAlternativeMouseover(root_label_node, this.label_alternatives[depedge_name])
                    }
                    label_at_position[max_level_here + 1][tail] = [head, tail, root_label_node]
                    total_min_y = Math.min(total_min_y, y)
                }
            }

            total_min_y = total_min_y - 20 // just to have a bit of a gap at the top

            // fix column and node positions
            for (let i = 0; i < this.cells.length; i++) {
                // fix column position first

                // get the rightmost edge of any attached edge that is to the left of this
                let max_edge_right = -MIN_DEPLABEL_CELL_DIST // so if we add that distance later, we get 0
                for (let gap_index = 0; gap_index < i; gap_index++) {
                    for (let level_index = 0; level_index < label_at_position.length; level_index++) {
                        let label = label_at_position[level_index][gap_index]
                        if (label != null) {
                            // check if the edge is actually an edge that is attached here (and the edge is to the left)
                            let right_attached_column = Math.max(label[0], label[1])
                            if (right_attached_column === i) {
                                let label_node = label[2]
                                max_edge_right = Math.max(max_edge_right, label_node.getX() + label_node.getWidth())
                            }
                        }
                    }
                }
                let min_x_by_dep_node = max_edge_right - 0.5 * this.cells[i][0].getWidth() + MIN_DEPLABEL_CELL_DIST

                let min_x_by_cell = 0
                if (i > 0) {
                    min_x_by_cell = this.cells[i-1][0].getX() + this.cells[i-1][0].getWidth() + TOKEN_DISTANCE
                }
                let new_cell_x = Math.max(min_x_by_cell, min_x_by_dep_node)


                for (let j = 0; j<this.cells[i].length; j++) {
                    let cell = this.cells[i][j]
                    cell.translate(new_cell_x, cell.getY() - total_min_y)
                }


                // now fix node positions
                for (let level_index = 0; level_index < label_at_position.length; level_index++) {
                    let label = label_at_position[level_index][i]
                    if (label != null) {

                        // get minimum x as per the labels to the left of this
                        let min_x_by_label = -MIN_DEPLABEL_DEPLABEL_DIST
                        for (let gap_index = 0; gap_index < i; gap_index++) {
                            let label_here = label_at_position[level_index][gap_index]
                            if (label_here != null) {
                                let label_node = label_here[2]
                                min_x_by_label = Math.max(min_x_by_label, label_node.getX() + label_node.getWidth())
                            }
                        }
                        min_x_by_label = min_x_by_label + MIN_DEPLABEL_DEPLABEL_DIST

                        // get minimum_x as per the left cell this attaches to
                        let min_x_by_cell = 0
                        let left_attached_column = Math.min(label[0], label[1])
                        if (left_attached_column === -1) {
                            // center-align root node with its column
                            let right_attached_column = Math.max(label[0], label[1])
                            min_x_by_cell = this.cells[right_attached_column][0].getX()
                                + 0.5 * this.cells[right_attached_column][0].getWidth()
                                - 0.5 * label[2].getWidth()
                        } else {
                            min_x_by_cell = this.cells[left_attached_column][0].getX()
                                + 0.5 * this.cells[left_attached_column][0].getWidth()
                                + MIN_DEPLABEL_CELL_DIST
                        }
                        let new_node_x = Math.max(min_x_by_cell, min_x_by_label)

                        let label_node = label[2]
                        label_node.translate(new_node_x, label_node.getY() - total_min_y)
                    }
                }
            }

            // recenter nodes now that the first pass is done
            // also set XY boxes for dragging
            for (let level_index = 0; level_index < label_at_position.length; level_index++) {
                for (let gap_index = 0; gap_index<label_at_position[level_index].length; gap_index++) {
                    let label = label_at_position[level_index][gap_index]
                    if (label != null) {
                        let label_node = label[2]
                        let id = label_node.group.data()[0].id
                        let min_x = label_node.getX()
                        let max_x;
                        if (label[0] >= 0) {
                            let right_attached_column = Math.max(label[0], label[1])
                            max_x = Math.max(this.cells[right_attached_column][0].getX()
                                + 0.5 * this.cells[right_attached_column][0].getWidth(), min_x)
                                - label_node.getWidth() - MIN_DEPLABEL_CELL_DIST
                        } else {
                            max_x = label_node.getX()
                        }
                        let min_y = -1000
                        let max_y = -total_min_y - DEP_TREE_BASE_Y_OFFSET
                        NODE_ID_TO_XY_BOX[id] = [min_x, max_x, min_y, max_y]

                        if (label[0] >= 0) {
                            let left_attached_column = Math.min(label[0], label[1])
                            let right_attached_column = Math.max(label[0], label[1])
                            let new_node_x = 0
                            new_node_x = (this.cells[left_attached_column][0].getX()
                                    + 0.5 * this.cells[left_attached_column][0].getWidth()
                                    + this.cells[right_attached_column][0].getX()
                                    + 0.5 * this.cells[right_attached_column][0].getWidth()) / 2
                                - 0.5 * label_node.getWidth()
                            label_node.translate(new_node_x, label_node.getY())
                        }
                    }
                }
            }



            // draw edges


            for (let level_index = 0; level_index < label_at_position.length; level_index++) {
                for (let gap_index = 0; gap_index < label_at_position[level_index].length; gap_index++) {
                    if (label_at_position[level_index][gap_index] != null) {
                        let label = label_at_position[level_index][gap_index]
                        let color = label[2].border_color

                        // arrow in
                        let entering_edge = null
                        if (label[0] >= 0) {
                            entering_edge = this.canvas.append("path").data([label])
                                .attr("shape-rendering", "geometricPrecision")
                                .style("stroke", color)
                                .style("stroke-width", 1.5)
                                .style("fill", "none")
                                // .attr("marker-end", marker(color, this.canvas))
                                .attr("d", d => this.getEnteringEdgePathFromLabel(d))
                                .attr("class", EDGE_CLASSNAME)
                                .lower()
                            label[2].registerDependencyEdge(entering_edge, false, label, this)
                        }
                        let outgoing_edge = this.canvas.append("path").data([label])
                            .attr("shape-rendering", "geometricPrecision")
                            .style("stroke", color)
                            .style("stroke-width", 1.5)
                            .style("fill", "none")
                            .attr("marker-end", marker(color, this.canvas))
                            .attr("d", d => this.getOutgoingEdgePathFromLabel(d))
                            .attr("class", EDGE_CLASSNAME)
                            .lower()
                        label[2].registerDependencyEdge(outgoing_edge, true, label, this)
                        if (entering_edge != null) {
                            this.registerFullDependencyEdgeHighlightingOnObjectMouseover(entering_edge, entering_edge,
                                outgoing_edge, label[2])
                        }
                        this.registerFullDependencyEdgeHighlightingOnObjectMouseover(outgoing_edge, entering_edge,
                            outgoing_edge, label[2])
                        this.registerFullDependencyEdgeHighlightingOnObjectMouseover(label[2].rectangle, entering_edge,
                            outgoing_edge, label[2])
                        for (let i = 0; i < this.cells[label[1]].length; i++) {
                            this.registerFullDependencyEdgeHighlightingOnObjectMouseover(this.cells[label[1]][i].rectangle, entering_edge,
                                outgoing_edge, label[2])
                        }
                        if (label[0] >= 0) {
                            for (let i = 0; i < this.cells[label[0]].length; i++) {
                                this.registerFullDependencyEdgeHighlightingOnObjectMouseover(this.cells[label[0]][i].rectangle, entering_edge,
                                    outgoing_edge, label[2])
                            }
                        }
                    }
                }
            }

        }
    }

    getEnteringEdgePathFromLabel(label) {
        let cell_x_width_factor = this.get_dep_edge_x_attachment_factor(label[0], label[1]);
        let cell_x = this.cells[label[0]][0].getX() + cell_x_width_factor * this.cells[label[0]][0].getWidth()
        let cell_y = this.cells[label[0]][0].getY()
        let edge_goes_left_to_right = label[0] < label[1]
        let label_x = null
        if (edge_goes_left_to_right) {
            label_x = label[2].getX()
        } else {
            label_x = label[2].getX() + label[2].getWidth()
        }
        let label_y = label[2].getY() + 0.8 * getReproducibleRandomNumberFromLabel(label) * label[2].getHeight()
        let startpoint = {x: cell_x, y: cell_y}
        let endpoint = {x: label_x, y: label_y}
        let edge = d3.path()
        edge.moveTo(startpoint.x, startpoint.y)
        edge.bezierCurveTo(startpoint.x, endpoint.y,
            startpoint.x, endpoint.y,
            endpoint.x, endpoint.y)
        return edge
    }

    getOutgoingEdgePathFromLabel(label) {
        let cell_x_width_factor = this.get_dep_edge_x_attachment_factor(label[1], label[0]);
        let cell_x = this.cells[label[1]][0].getX() + cell_x_width_factor * this.cells[label[1]][0].getWidth()
        let cell_y = this.cells[label[1]][0].getY()
        let label_x
        let label_y
        if (label[0] === -1) {
            label_x = label[2].getX() + 0.5 * label[2].getWidth()
            label_y = label[2].getY() + label[2].getHeight()
        } else {
            let edge_goes_left_to_right = label[0] < label[1]
            if (edge_goes_left_to_right) {
                label_x = label[2].getX() + label[2].getWidth()
            } else {
                label_x = label[2].getX()
            }
            label_y = label[2].getY() + 0.8 * getReproducibleRandomNumberFromLabel(label) * label[2].getHeight()
        }
        let startpoint = {x: label_x, y: label_y}
        let endpoint = {x: cell_x, y: cell_y}
        let edge = d3.path()
        edge.moveTo(startpoint.x, startpoint.y)
        edge.bezierCurveTo(endpoint.x, startpoint.y,
            endpoint.x, startpoint.y,
            endpoint.x, endpoint.y)
        return edge
    }


    get_dep_edge_x_attachment_factor(cell_index_here, other_cell_index) {
        let cell_x_width_factor = 0.5
        if (other_cell_index >= 0) {
            if (cell_index_here < other_cell_index) {
                cell_x_width_factor = 0.9 - 0.8 * (sigmoid((other_cell_index - cell_index_here) / 2)-0.5)
            } else {
                cell_x_width_factor = 0.1 + 0.8 * (sigmoid((cell_index_here - other_cell_index) / 2)-0.5)
            }
        }
        return cell_x_width_factor;
    }

    registerEdgeHighlightingOnObjectMouseover(object, edge_object, stroke_width=3) {
        object.on("mouseover.edge"+create_alias(), function() {
                edge_object.style("stroke-width", stroke_width)
            })
            .on("mouseout.edge"+create_alias(), function() {
                edge_object.style("stroke-width", 1.5)
            })
    }

    registerNodeHighlightingOnObjectMouseover(object, node_object) {
        let current_stroke_width = parseInt(node_object.rectangle.style("stroke-width"))
        let bold_stroke_width = current_stroke_width + 2
        object.on("mouseover.node"+create_alias(), function() {
                node_object.rectangle.style("stroke-width", bold_stroke_width)
            })
            .on("mouseout.node"+create_alias(), function() {
                node_object.rectangle.style("stroke-width", current_stroke_width)
            })
    }

    registerFullDependencyEdgeHighlightingOnObjectMouseover(object, entering_edge, outgoing_edge, node_object) {
        this.registerNodeHighlightingOnObjectMouseover(object, node_object)
        if (entering_edge != null) {
            this.registerEdgeHighlightingOnObjectMouseover(object, entering_edge)
        }
        this.registerEdgeHighlightingOnObjectMouseover(object, outgoing_edge)
    }

    find_slot_closest_to_center(available_label_slots, min_bound, max_bound) {
        let center = (min_bound + max_bound - 1) / 2
        let best_label_slot = available_label_slots[0]
        let best_distance = Math.abs(best_label_slot - center)
        for (let k = 1; k < available_label_slots.length; k++) {
            let distance_here = Math.abs(available_label_slots[k] - center)
            if (distance_here < best_distance) {
                best_distance = distance_here
                best_label_slot = available_label_slots[k]
            }
        }
        return best_label_slot;
    }

    register_mouseover_highlighting(node_object) {
        let current_stroke_width = parseInt(node_object.rectangle.style("stroke-width"))
        let bold_stroke_width = current_stroke_width + 2
        node_object.rectangle.on("mouseover", function() {
                node_object.rectangle.style("stroke-width", bold_stroke_width)
            })
            .on("mouseout", function() {
                node_object.rectangle.style("stroke-width", current_stroke_width)
            })
    }

    registerNodesGlobally(canvas_name) {
        let dict_here = {}
        for (let i = 0; i < this.cells.length; i++) {
            for (let j = 0; j < this.cells[i].length; j++) {
                // note that node names have the row index first, and then the column index
                // even though in this.cells, the column index comes first
                // this is to match the general convention of having the row index first in the node name
                // the fact that this.cells is the other way around has technical reasons, and shouldn't spread further.
                dict_here["("+j+", "+i+")"] = this.cells[i][j]
            }
        }
        canvas_name_to_node_name_to_node_dict[canvas_name] = dict_here
    }

    registerNodeAlternativeMouseover(node_object, node_label_alternatives) {
        let strings_object = this

        node_object.rectangle.on("mouseover.node_alternative", function() {
            // console.log("mouseover")
                current_mouseover_node = node_object
                current_mouseover_canvas = strings_object.canvas
                current_mouseover_label_alternatives = node_label_alternatives
            // check if alt key is currently pressed
                if (d3.event.ctrlKey) {
                    show_label_alternatives(node_object, node_label_alternatives, strings_object.canvas)
                }
            })
            .on("mouseout.node_alternative", function() {
                current_mouseover_node = null
                current_mouseover_canvas = null
                current_mouseover_label_alternatives = null
                if (d3.event.ctrlKey) {
                    hide_label_alternatives(strings_object.canvas)
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
}

function dependencyTreeNodeDragged(d) {
    // console.log(node_object.registeredEdges.length)
    // console.log(d.id)
    // console.log(NODE_ID_TO_XY_BOX)
    let min_x = NODE_ID_TO_XY_BOX[d.id][0]
    let max_x = NODE_ID_TO_XY_BOX[d.id][1]
    let min_y = NODE_ID_TO_XY_BOX[d.id][2]
    let max_y = NODE_ID_TO_XY_BOX[d.id][3]
    d.x = Math.max(Math.min(d.x + d3.event.dx, max_x), min_x);
    d.y = Math.max(Math.min(d.y + d3.event.dy, max_y), min_y);
    let registeredEdges = ALL_NODES[d.id].registeredEdges
    for (let i = 0; i < registeredEdges.length; i++) {
        let edge = registeredEdges[i][0]
        let is_outgoing = registeredEdges[i][1]
        let label = registeredEdges[i][2]
        let table = registeredEdges[i][3]
        if (is_outgoing) {
            edge.attr("d", d => table.getOutgoingEdgePathFromLabel(label))
        } else {
            edge.attr("d", d => table.getEnteringEdgePathFromLabel(label))
        }
    }
    // console.log(registeredEdges.length)
    ALL_NODES[d.id].group.attr("transform", "translate(" + d.x + "," + d.y + ")");
}
