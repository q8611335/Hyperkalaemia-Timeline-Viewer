
let admissionAll = [];
async function main() {
    admissionAll = await (await fetch("/api/admissions")).json(); // ask Flask for the admission list
    
    // find all unique admission and build dropdown menu
    const select = document.getElementById("admission-select");
    for (const a of admissionAll) {
        const option = document.createElement("option");
        option.value = a.hadm_id;
        option.textContent = `${a.hadm_id} · max K ${a.max_k}${a.phenotype ? " ★" : ""}${a.high_k_on_admission ? " ▲" : ""}`;
        select.append(option);
    }

    // change to the selected admission when menu changed
    select.addEventListener("change", () => drawAdmission(Number(select.value)));

    select.value = 20297618; // set as default
    drawAdmission(20297618);
    drawHeatmap();
}

async function drawAdmission(hadmId) {

    // filter out admission from all patient
    const t = await (await fetch(`/api/timeline/${hadmId}`)).json();
    const adm = t.admission;
    const data = t.labs;
    const txData = t.treatments;

    const x = data.map(d => d.charttime); // extract charttime
    const y = data.map(d => d.valuenum); // extract valuenum
    const colors = y.map(v => v > 5.0 ? "red" : "steelblue"); // color based on potassium level
    // console.log(x, y);
    const shapes = [
            {
                type: "rect",
                xref: "paper", x0: 0, x1: 1, // horizontal: left to right 
                yref: "y", y0:3.5,y1:5.0,    // vertical: potassium levels from 3.5 to 5.0
                fillcolor: "rgba(144, 236, 144, 0.15)",
                line: { width: 0 },
                layer: "below",
            },
            {
                type: "line",
                xref: "paper", x0: 0, x1: 1, // horizontal: left to right
                yref: "y", y0: 5.0, y1: 5.0, // vertical: potassium level boundary > 5.0
                line: { color: "red", width: 1.5, dash: "dash" },
            },
        ];

        // onset line and 2-hour window: only admissions that meet the phenotype
        if (adm.phenotype) {
            shapes.push(
                {
                    type: "line",
                    xref: "x", x0: adm.onset_time, x1: adm.onset_time,
                    yref: "paper", y0: 0, y1: 1,
                    line: { color: "blue", width: 1.5},
                },
                {
                    type: "rect",
                    xref: "x", x0: adm.onset_time, x1: adm.window_end,
                    yref: "paper", y0: 0, y1: 1,
                    fillcolor: "rgba(0, 0, 255, 0.08)",
                    line: { width: 0 },
                    layer: "below",
                },

            );
        }

    
    Plotly.newPlot("chart", [ // trace
        { x: x, y: y, mode: "lines+markers", name: "Potassium", marker: { color: colors, size: 9 } },
        { x: txData.map(d => d.charttime), y: txData.map(d => d.drug_class), yaxis: "y2", mode: "markers", name: "IV Treatment", marker: { symbol: "triangle-up", size: 12, color: "purple" } }
    ], { // layout
        title: { text: `Admission ${hadmId}${adm.high_k_on_admission ? " · K⁺ already high on admission" : ""}`, 
        font: { size: 14 } },
        height: 520,
        margin: { l: 110, r: 20, t: 40, b: 40 },
        yaxis: { title: "K⁺ (mmol/L)", domain: [0.35, 1] },
        yaxis2: { type: "category", domain: [0, 0.25] },
        xaxis: { anchor: "y2" },
        legend: { orientation: "h", y: -0.12 },
        shapes: shapes,
    }, { displayModeBar: false, responsive: true }); // config
}

async function drawHeatmap() {
    const heat = await (await fetch("/api/heatmap")).json();
    Plotly.newPlot("heatmap", [ // trace
        {
            type: "heatmap",
            x: heat.x,
            y: heat.y,
            z: heat.z,
            colorscale: [
                 [0, "#f2f4f4"],                // 0 : no meds
                [0.001, "#c6dbf5"],            // 1 : 1 med
                [1, "#0d3b7a"],                 // multiple time
            ],
            xgap: 2, ygap: 2,
            text: heat.z.map(row => row.map(v => v === 0 ? "" : v)),
            texttemplate: "%{text}",
            showscale: false,
            hovertemplate: "Admission %{y}<br>%{x}: %{z} dose(s)<extra></extra>"
        },
    ], { // layout
        height: heat.y.length * 18 + 60,
        yaxis: { type: "category", autorange: "reversed",
                dtick: 1, tickfont: { size: 10 } },
        xaxis: { side: "top" },
        margin: { l:80, r: 10, t: 40, b: 10 },

    }, { displayModeBar: false, responsive: true }); // config

    document.getElementById("heatmap").on("plotly_click", (ev) => {
        const id = Number(ev.points[0].y);
        document.getElementById("admission-select").value = id;
        drawAdmission(id);
    });
}

main();