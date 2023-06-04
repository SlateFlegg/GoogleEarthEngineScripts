var s2_msi = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED"),
    NaturalParam = {"opacity":1,"bands":["B4","B3","B2"],"min":110,"max":1420,"gamma":1},
    AgricultureParam = {"opacity":1,"bands":["B11","B8","B2"],"min":42,"max":4169.5,"gamma":1},
    FalseColor = {"opacity":1,"bands":["B8","B3","B2"],"min":70,"max":4023.5,"gamma":1},
    Voronezh = 
    /* color: #00ffff */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[38.93314758216707, 52.051515219181624],
          [38.93314758216707, 51.702221421935256],
          [39.87934509193269, 51.702221421935256],
          [39.87934509193269, 52.051515219181624]]], null, false),
    Brumadinho = 
    /* color: #ff0000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-44.157195021204096, -20.108856251638947],
          [-44.157195021204096, -20.161558816867643],
          [-44.08750050216113, -20.161558816867643],
          [-44.08750050216113, -20.108856251638947]]], null, false);

// Выбираем нужную геометию
// Брумандинье - прорыв дамбы хвостохранилища на железнорудных хвостах
var aoi = Brumadinho;
Map.centerObject(Brumadinho);
// функция фильтрации коллекции
function filterColl(start, end, clouds) {
  var s2 = s2_msi
    .filterBounds(aoi)
    .filterDate(start, end)
    .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', clouds);
    return s2;
}
// функция для отрисовки снимков в трёх визализациях
function map_it (img, postfix) {
  var s2 = img.median().clip(aoi);
  Map.addLayer(s2, NaturalParam, ('Sentinel-2 Natural Color ' + postfix));
  Map.addLayer(s2, FalseColor, ('Sentinel-2 May False Color ' + postfix));
  Map.addLayer(s2, AgricultureParam, ('Sentinel-2 May Agriculture '  + postfix));
}

var s2_before = filterColl('2019-01-01', '2019-01-22', 20);
print(s2_before); // смотрим состав отфильтрованной коллекции
map_it(s2_before, 'before');

var s2_after = filterColl('2019-02-01', '2019-02-22', 20);
map_it(s2_after, 'after');

var s2_today = filterColl('2023-05-01', '2023-05-22', 20);
map_it(s2_today, 'today');


Export.image.toDrive({
  image: s2_today,
  description: 's2_today',
  region: Brumadinho
});
