var VPElev = {"opacity":1,"bands":["elevation"],"min":-2,"max":944,"palette":["1328ff","66ffd3","d4ff67","ffce89","ff6666"]},
    VPSlope = {"opacity":1,"bands":["slope"],"min":0,"max":13.42381477355957,"gamma":1},
    VPClassSlope = {"opacity":1,"bands":["constant"],"min":0,"max":5,"palette":["c2c2c2","0fcaff","09ff19","f3ff0f","ff2505"]},
    DEM = ee.Image("CGIAR/SRTM90_V4"),
    precipitation = ee.ImageCollection("IDAHO_EPSCOR/TERRACLIMATE"),
    VPRainfall = {"opacity":1,"bands":["pr"],"min":38.75,"max":76.25,"palette":["ff6611","ff9c27","eeff52","90ff27","27ffc1","27cfff","212aff"]},
    Nahodka = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[131.49704611039172, 43.877123773832],
          [130.56320821976672, 42.5075562061571],
          [130.62912618851672, 42.21531275054318],
          [134.46335470414172, 42.774251432357815],
          [132.27707540726672, 43.94835441357887]]]);


// Вводим область интереса и центрируемся
var aoi = Nahodka;
Map.centerObject(aoi, 8);
// подгружаем ЦМР и вводми её
var elevation = ee.Image(DEM).select('elevation').clip(aoi);
Map.addLayer(elevation, VPElev, 'Высоты');

//Расчитываем углы наклона
var slope =ee.Terrain.slope(elevation).clip(elevation.geometry());
Map.addLayer(slope, VPSlope, 'Углы наклона');
var slope_reclass = ee.Image(0)
    .where(slope.gte(20), 5) 
    .where(slope.gte(15).and(slope.lt(20)), 4) 
    .where(slope.gte(10).and(slope.lt(15)), 3)
    .where(slope.gte(5).and(slope.lt(10)), 2) 
    .where(slope.gte(0.5).and(slope.lt(5)), 1)
    //.where(slope.gte(0).and(slope.lt(0.5)), 0)
    .clip(elevation.geometry()); // данные обрезаются по области интереса
Map.addLayer (slope_reclass, VPClassSlope, 'Углы наклона: классы' );

// подгружаем карту осадков
// подгружаем карту осадков
var date_start ='10-27'
var date_end = '11-06'
var rain2022 = precipitation.filterDate('2022-'+date_start, '2022-'+date_end);
var rain2021 = precipitation.filterDate('2021-'+date_start, '2021-'+date_end);
var rain2020 = precipitation.filterDate('2020-'+date_start, '2020-'+date_end);
var rain2019 = precipitation.filterDate('2019-'+date_start, '2019-'+date_end);

var perc_filt = ee.ImageCollection(rain2022.merge(rain2021).merge(rain2020).merge(rain2019));

var rainfall = perc_filt
  .select('pr')
  .mean()
  .clip(aoi);
Map.addLayer(rainfall, VPRainfall, 'Средние осадки осень (2019 - 2022)');

// Ищем тропинки

// Объявляем функцию для расчета NDVI 
function addNDVI(image) {
  var ndvi = image.expression("(NIR - red)/(NIR + red)", 
  {NIR : image.select('B8'), // B5 for landsat & B8 for sentinel-2
    red : image.select('B4') // B4 for landsat & sentinel-2
  }).rename('NDVI');
  return image.addBands(ndvi);
}

// зададим функцию, возвращающую отфильтрованную и пониженную коллекцию
function col_to_img (start, end) {
  var img_collection = ee.ImageCollection('COPERNICUS/S2')
    .filterDate(start,end)
    .filter(ee.Filter.lt('CLOUD_COVERAGE_ASSESSMENT',15));
  var image = img_collection
    .median()
    .clip(Nahodka);
  var NDVI = addNDVI(image);
  return NDVI;
}

// Данные на октябрь-ноябрь 2021
var start = '2021-'+date_start;
var end = '2021-'+date_end;
var NDVI21 = col_to_img (start, end);
Map.addLayer(NDVI21.select('NDVI'), {}, 'NDVI_2021');

// Данные на октябрь-ноябрь 2022
var start = '2022-'+date_start;
var end = '2022-'+date_end;
var NDVI22 = col_to_img (start, end);
Map.addLayer(NDVI22.select('NDVI'), {}, 'NDVI_2022');


// Выбираем канал NDVI и считаем разницу
var ndvi2021 = NDVI21.select('NDVI');
var ndvi2022 = NDVI22.select('NDVI');
var diff = ndvi2022.subtract(ndvi2021).divide(ndvi2021).multiply(100);

// Создаём маску и выводим просеку
var mask = diff.lt(3)  // tye 0.5
var masked = diff.updateMask(mask)
Map.addLayer(masked, {}, 'Masked NDVI')
