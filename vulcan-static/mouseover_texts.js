MOUSEOVER_TEXT_CLASSNAME = "mouseover_text"

function show_mouseover_text(node_object, mouseover_text, canvas) {
    let x = node_object.getX() + node_object.getWidth() + 10
    let y = node_object.getY()

    let lines = mouseover_text.split("\n")

    let width = 500
    let height = 25 * lines.length + 20


    canvas.append("rect")
        .attr("x", x)
        .attr("y", y)
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#d6eef5")
        .attr("class", MOUSEOVER_TEXT_CLASSNAME)


    // c.f. https://stackoverflow.com/questions/16701522/how-to-linebreak-an-svg-text-within-javascript/16701952#16701952

    let textfield = canvas.append("text")
            .attr("x", x)
            .attr("y", y)
            .attr("class", MOUSEOVER_TEXT_CLASSNAME)
    lines.forEach(function(line, index) {
        let bold = false
        if (index === 0 && lines.length > 1) {
            bold = true
        }
        textfield.append("tspan")
            .attr("x", x + 10)
            .attr("dy", 25)
            .attr("font-weight", bold ? "bold" : "normal")
            .text(line)
    })

}

function hide_mouseover_text(canvas) {
    canvas.selectAll("."+MOUSEOVER_TEXT_CLASSNAME).remove()
}