NODE_ALTERNATIVE_CLASSNAME = "node_alternative"

function show_label_alternatives(node_object, label_alternatives, canvas) {
    // canvas.append("rect")
    //     .attr("x", node_object.getX() + 50)
    //     .attr("y", node_object.getY())
    //     .attr("width", 50)
    //     .attr("height", 50)
    //     .attr("class", NODE_ALTERNATIVE_CLASSNAME)
    if (label_alternatives != null) {
        let first_x = node_object.getX() + node_object.getWidth() + 10
        let current_x = first_x
        let y = node_object.getY()
        let max_height = 0
        let all_new_nodes = []
        for (let i = 0; i < label_alternatives.length; i++) {
            let label_alternative = label_alternatives[i]
            let new_node = createNode(current_x, y, label_alternative['label'], label_alternative['format'], canvas,
                false, null, NODE_ALTERNATIVE_CLASSNAME)
            if (new_node.getWidth() < 60) {
                new_node.setWidth(60)
            }
            all_new_nodes.push(new_node)
            current_x += Math.max(60, new_node.getWidth()) + 10
            max_height = Math.max(max_height, new_node.getHeight())
        }

        canvas.append("rect")
            .attr("x", first_x - 5)
            .attr("y", y - 5)
            .attr("width", current_x - first_x + 10)
            .attr("height", max_height + 30)
            .attr("fill", "#99FFBB")
            .attr("stroke", "#005522")
            .attr("stroke-width", 3)
            .attr("class", NODE_ALTERNATIVE_CLASSNAME)

        all_new_nodes.forEach(function (new_node) {
            d3.select(new_node.group.node()).raise()
        })

        for (let i = 0; i < label_alternatives.length; i++) {
            canvas.append("text")
                .attr("x", all_new_nodes[i].getX() + all_new_nodes[i].getWidth() / 2)
                .attr("y", y + max_height + 15)
                .attr("text-anchor", "middle")
                .attr("class", NODE_ALTERNATIVE_CLASSNAME)
                .text(make_score_human_readable(label_alternatives[i]['score']))
        }
    }

}

function make_score_human_readable(score) {
    if (score >= 100) {
        return score.toFixed(1)
    }
    if (score >= 0.001) {
        return score.toFixed(5)
    } else {
        // use scientific notation
        return score.toExponential(3)
    }
}

function hide_label_alternatives(canvas) {
    canvas.selectAll("."+NODE_ALTERNATIVE_CLASSNAME).remove()
}