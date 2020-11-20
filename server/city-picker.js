var mysql      = require('mysql');
var fs = require('fs')
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'nsc9988893589',
  database : 'city-picker'
});
 
connection.connect();
 
connection.query('SELECT * from tb_area,tb_city,tb_province WHERE tb_area.city_code = tb_city.city_code and tb_city.province_code = tb_province.province_code', function (error, results, fields) {
    if (error) throw error;

    var citys = {}
    var provinces = []
    for(var i = 0;i<results.length;i++){
        var item = results[i]
        if(!citys[item.province_code]) citys[item.province_code] = {
            province_name: item.province_name,
            province_code: item.province_code,
            child: {}
        }

        if(!citys[item.province_code].child[item.city_code]) citys[item.province_code].child[item.city_code] = {
            city_name: item.city_name,
            city_code: item.city_code,
            child: {}
        }

        if(!citys[item.province_code].child[item.city_code].child[item.area_code]) citys[item.province_code].child[item.city_code].child[item.area_code] = {
            area_code: item.area_code,
            area_name: item.area_name
        }
    }
    var provinceBox = []
    for(var province in citys){
        var citybox = []
        var q = 1
        for(var city in citys[province].child){
            var areas = []
            var p = 1
            for(var area in citys[province].child[city].child){
                var innerarea = citys[province].child[city].child[area]
                areas.push({
                    Name: innerarea.area_name,
                    Code: innerarea.area_code,
                    sort: p++
                })
            }
            var innerCity = citys[province].child[city]
            citybox.push({
                Name: innerCity.city_name,
                Code: innerCity.city_code,
                sort: q++,
                level: areas
            })
        }
        var innerProvince = citys[province]
        provinceBox.push({
            Name: innerProvince.province_name,
            Code: innerProvince.province_code,
            level: citybox
        })
    }

    fs.writeFile('./city.json', JSON.stringify(provinceBox), function (error) {
        if (error) {
            console.log('写入失败')
        } else {
            console.log('写入成功了')
        }
    })
});