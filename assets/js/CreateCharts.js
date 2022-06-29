
    var yearRingChart = dc.pieChart("#chart-ring-year"),
        spendHistChart = dc.barChart("#chart-hist-spend"),
        spenderRowChart = dc.rowChart("#chart-row-spenders");

    var table = dc.dataTable('#table');
    function createRecord() {
        return {
            Name: faker.random.arrayElement(['Mr A', 'Mr B', 'Mr C', 'Mr D']),
            Spent: faker.random.arrayElement(['$10', '$20', '$30', '$40', '$50', '$60', '$70', '$80', '$90']),
            Year: faker.random.number({ min: 2010, max: 2018 })
        }
    };
    function getAllData() {
      //this function creates a fake dataArray
        var dataArr = [];
        var theNumberOfRecords = 100;
        for (i = 0; i < theNumberOfRecords; i++) {
            dataArr.push(createRecord());
        }
        return dataArr;
    };
    // use static or load via d3.csv("spendData.csv", function(error, spendData) {/* do stuff */});
    var data = getAllData();

    // normalize/parse data
    data.forEach(function (d) {
        d.Spent = d.Spent.match(/\d+/)[0];
    });
    // set crossfilter
    var ndx = crossfilter(data),
        yearDim = ndx.dimension(function (d) { return +d.Year; }),
        spendDim = ndx.dimension(function (d) { return Math.floor(d.Spent / 10); }),
        nameDim = ndx.dimension(function (d) { return d.Name; }),
        spendPerYear = yearDim.group().reduceSum(function (d) { return +d.Spent; }),
        spendPerName = nameDim.group().reduceSum(function (d) { return +d.Spent; }),
        spendHist = spendDim.group().reduceCount();
    yearRingChart
        .width(300)
        .height(300)
        .dimension(yearDim)
        .group(spendPerYear)
        .innerRadius(80)
        .controlsUseVisibility(true);
    spendHistChart
        .dimension(spendDim)
        .group(spendHist)
        .x(d3.scaleLinear().domain([0, 10]))
        .elasticY(true)
        .controlsUseVisibility(true);
    spendHistChart.xAxis().tickFormat(function (d) { return d * 10 }); // convert back to base unit
    spendHistChart.yAxis().ticks(2);
    spenderRowChart
        .dimension(nameDim)
        .group(spendPerName)
        .elasticX(true)
        .controlsUseVisibility(true);
    var allDollars = ndx.groupAll().reduceSum(function (d) { return +d.Spent; });
    table
        .dimension(spendDim)
        .group(function (d) {
            return d.value;
        })
        .sortBy(function (d) { return +d.Spent; })
        .showGroups(false)
        .columns(['Name',
            {
                label: 'Spent',
                format: function (d) {
                    return '$' + d.Spent;
                }
            },
            'Year',
            {
                label: 'Percent of Total',
                format: function (d) {
                    return Math.floor((d.Spent / allDollars.value()) * 100) + '%';
                }
            }])

        .size(data.length);

    d3.select('#download')
        .on('click', function () {
            var data = nameDim.top(Infinity);
            if (d3.select('#download-type input:checked').node().value === 'table') {
                data = data.sort(function (a, b) {
                    return table.order()(table.sortBy()(a), table.sortBy()(b));
                });
                data = data.map(function (d) {
                    var row = {};
                    table.columns().forEach(function (c) {
                        row[table._doColumnHeaderFormat(c)] = table._doColumnValueFormat(c, d);
                    });
                    return row;
                });
            }
            var blob = new Blob([d3.csvFormat(data)], { type: "text/csv;charset=utf-8" });
            saveAs(blob, 'data.csv');
        });
    dc.renderAll();
