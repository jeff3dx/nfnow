// /* globals $, d3, topojson */

// import Ember from 'ember';
// import { world50m } from 'netflix-now/controllers/world50m';

// function secs(n) {
//   return 1000 * n;
// }

// function random(min, max) {
//   return Math.floor(Math.random() * (max - min + 1) + min);
// }
// function randomOf(arr) {
//   if (!Array.isArray(arr)) {
//     arr = arguments;
//   }
//   var len = arr.length;
//   var i = random(0, len - 1);
//   return arr[i];
// }

// export default Ember.Component.extend({

//   classNames: ['earth'],

//   server: 'http://localhost:8888',

//   eventsData: null,
//   movieData: null,

//   sampleCount: 50,
//   zoom: 1000,
//   fade: 750,
//   speed: 200,

//   topTitleWidth: 300,
//   topTitleHeight: 300,
//   topTitleBarWidth: 100,

//   artWorks: {},

//   sendServerRequest: function(query, fn) {
//     $.support.cors = true;

//     $.ajax({
//       url: query,
//       type: 'post',
//       dataType: 'json',
//       headers: {'Access-Control-Allow-Origin': '*' },

//       success: function(data) {
//         fn(data);
//       }
//     });
//   },

//   requestEventData: function(fn) {
//     var self = this;
//     self.sendServerRequest('http://localhost:8888?type=events', function(data) {
//       fn(data);
//     });
//   },

//   requestMovieData: function(needed, fn) {
//     var self = this;
//     var json;
//     var fixed1, fixed2;
//     var query = 'http://localhost:8888?type=movie&mids=%@'.fmt(needed);
//     self.sendServerRequest(query, function(data) {
//       fixed1 = data.replace(/}{/g, '},{');
//       fixed2 = '{"data":[' + fixed1 + ']}';
//       json = JSON.parse(fixed2);
//       fn(json);
//     });

//   },

//   tally: {},

//   hoverTitle: '',
//   hoverImageSrc: '',
//   hoverStyle: '',

//   onMouseEnter: function(d, i, d3event, el, self) {
//     var x = d3event.pageX;
//     var y = d3event.pageY;
//     Ember.run(function() {
//       self.set('hoverImageSrc', d.artUrl);
//       self.set('hoverTitle', d.title);
//       self.positionHover(x, y, self);
//     });
//   },

//   onMouseMove: function(d, i, d3event, el, self) {
//     var x = d3event.pageX;
//     var y = d3event.pageY;
//     Ember.run(function() {
//       self.positionHover(x, y, self);
//     });
//   },

//   onMouseLeave: function(d, i, d3event, el, self) {
//     Ember.run(function() {
//       var style = 'visibility: hidden;';
//       self.set('hoverStyle', style);
//     });
//   },

//   positionHover: function(x, y, self) {
//     Ember.run(function() {
//       var style = 'left: %@px; top:%@px; visibility: visible;'.fmt(x, y);
//       self.set('hoverStyle', style);
//     });
//   },


//   topTitles: function() {
//     var self = this;

//     var tally = this.get('tally');
//     var keys = Object.keys(tally);

//     var width = 575;
//     var height = 300;

//     var barWidth = 40;
//     var artSize = 50;

//     var padLeft = 10;
//     var maxBars = 10;
//     var gap = 15;
//     var speed = 1000;

//     var sorted = keys.map(function(k) {
//       return {
//         mid:k,
//         count: tally[k].count,
//         title:tally[k].video.title,
//         artUrl: tally[k].video.artUrl,
//         date:tally[k].date };
//     });

//     sorted.sort(function(a,b) {
//       if( b === a) {
//         return b.date - a.date;
//       }
//       return b.count - a.count;
//     });

//     sorted.forEach(function(d, i) {
//       d.rank = i;
//     });

//     var len = sorted.length;
//     if(len > maxBars) {
//       sorted.splice(maxBars, len - maxBars);
//     }

//     function xscale(x) {
//       return (x * barWidth) + (gap * x) + padLeft;
//     }

//     var yscale = d3.scale.linear()
//       .domain([0, Math.max(10, d3.max(sorted, function(d) { return d.count; }))])
//       .range([0, height]);

//     var svg = d3.select('div.top-titles svg')
//       .attr('width', width)
//       .attr('height', height);

//     // bind data
//     var updateBar = svg.selectAll('rect')
//       .data(sorted, function(d) { return d['mid']; });

//     var updateArt = svg.selectAll('image')
//       .data(sorted, function(d) { return d['mid']; });

//     // drop off
//     updateBar.exit().remove();
//     updateArt.exit().remove();

//     // add bar
//     updateBar.enter().append('rect')
//       .attr('x', function(d) { return xscale(d.rank); })
//       .attr('y', function(d) { return height - yscale(d.count); })
//       .attr('width', barWidth)
//       .attr('height', function(d) { return yscale(d.count); })
//       .attr('title', function(d) { return d.title; })
//       .style('opacity', 0)
//       .on('mouseenter', function(d, i) { self.onMouseEnter(d, i, d3.event, this, self); } )
//       .on('mousemove', function(d, i) { self.onMouseMove(d, i, d3.event, this, self); } )
//       .on('mouseleave', function(d, i) { self.onMouseLeave(d, i, d3.event, this, self); } );

//     // add art
//     updateArt.enter().append('image')
//       .attr('title', function(d) { return d.title; })
//       .attr('x', function(d) { return xscale(d.rank) - 5; })
//       .attr('y', function(d) {
//         var y = height - yscale(d.count) - 12;
//         return Math.min(y, height - artSize);
//       })
//       .attr('width', barWidth + 10)
//       .attr('height', artSize)
//       .attr('xlink:href', function(d) { return d.artUrl; })
//       .style('opacity', 0)
//       .on('mouseenter', function(d, i) { self.onMouseEnter(d, i, d3.event, this, self); } )
//       .on('mousemove', function(d, i) { self.onMouseMove(d, i, d3.event, this, self); } )
//       .on('mouseleave', function(d, i) { self.onMouseLeave(d, i, d3.event, this, self); } );


//     // update existing bar
//     updateBar.transition().duration(speed)
//       .attr('x', function(d) { return xscale(d.rank); })
//       .attr('y', function(d) { return height - yscale(d.count); })
//       .attr('height', function(d) { return yscale(d.count); })
//       .style('opacity', 1);

//     // update existing art
//     updateArt.transition().duration(speed)
//       .attr('x', function(d) { return xscale(d.rank) - 5; })
//       .attr('y', function(d) {
//         var y = height - yscale(d.count) - 12;
//         return Math.min(y, height - artSize);
//       })
//       .style('opacity', 1);
//   },


//   didInsertElement: function() {
//     this.drawGlobe();
//     this.start();
//   },

//   willDestroyElement: function() {
//     clearInterval(this.timer);
//   },

//   timer: null,

//   start: function() {
//     var self = this;
//     self.getMoreSamples();
//     self.timer = setInterval(function() {
//       self.getMoreSamples();
//     }, secs(6));
//   },

//   addTally: function(video) {

//     var tally = this.get('tally');

//     if(!tally.hasOwnProperty(video.mid)) {
//       tally[video.mid] = { count: 0, video: video };
//     }
//     tally[video.mid].count += 1;

//     this.topTitles();
//   },

//   getMoreSamples: function() {
//     var self = this;

//     self.requestEventData(function(data) {
//       var east = JSON.parse(data.east);
//       var west = JSON.parse(data.west);
//       var all = [];
//       var wlen = west.events.length;

//       // zip together east and west
//       east.events.forEach(function(e, i) {
//         all.push(e);
//         if(i < wlen) {
//           all.push(west.events[i]);
//         }
//       });

//       // needed art
//       var existingArtWork = self.get('artWorks');
//       var neededArtWorks = [];
//       all.forEach(function(d) {
//         var mid = d.content['mid'];
//         if(!existingArtWork.hasOwnProperty(mid)) {
//           neededArtWorks.push(mid);
//         }
//       });

//       var needed = neededArtWorks.join();

//       // get art
//       self.requestMovieData(needed, function(videos) {

//         videos.data.forEach(function(v){
//           if(v.artworks.length > 0) {
//             existingArtWork[v.id] = {
//               title: v.title,
//               mid: v.id,
//               artUrl: v.artworks[0].url
//             };
//           }

//         });

//         all.forEach(function(d, i) {
//           if(!existingArtWork[d.content['mid']]) {
//             return;
//           }

//           var lat = d.content["geo.latitude"];
//           var lng = d.content["geo.longitude"];
//           var video = existingArtWork[d.content['mid']];
//           var date = Date.now();

//           //tally and image
//           self.addTally(video, date);

//           // save lng, lat in closure
//           (function plot(lng, lat) {
//             setTimeout(function() {
//               self.plotSample(lng, lat, video);
//             }, i * self.get('speed'));
//           })(lng, lat);
//         });

//       }); // get art

//     }); // get events

//   },

//   projection: null,
//   svg: null,

//   plotSample: function(lng, lat, video) {
//     var projection = this.get('projection');
//     var svg = this.get('svg');

//     var width = 100;
//     var height = 100;
//     var xy = projection([lng, lat]);

//     var image = svg.append('image')
//       .attr('x', xy[0])
//       .attr('y', xy[1])
//       .attr('width', 1)
//       .attr('height', 1)
//       .style('opacity', 1)
//       .attr('xlink:href', video.artUrl)
//       .attr('title', video.title);

//     image.transition().duration(this.get('zoom'))
//       .attr('x', xy[0] - (width / 2))
//       .attr('y', xy[1] - (height /2))
//       .attr('width', width)
//       .attr('height', height)
//         .transition().duration(this.get('fade'))
//         .style('opacity', 0)
//           .transition(1)
//           .remove();
//   },


//   drawGlobe: function() {
//     var width = 1300,
//         height = 600;

//     var projection = d3.geo.orthographic()
//         .scale(1000)
//         .translate([150, 1000])
//         .clipAngle(90)
//         .precision(0.1)
//         .rotate([120,0,0]);
//     this.projection = projection;

//     var path = d3.geo.path()
//         .projection(projection);

//     var graticule = d3.geo.graticule();

//     var earth = d3.select('div.earth');

//     var svg = earth.append("svg")
//         .attr("width", width)
//         .attr("height", height);
//     this.svg = svg;

//     svg.append("defs").append("path")
//         .datum({type: "Sphere"})
//         .attr("id", "sphere")
//         .attr("d", path);

//     svg.append("use")
//         .attr("class", "stroke")
//         .attr("xlink:href", "#sphere");

//     svg.append("use")
//         .attr("class", "fill")
//         .attr("xlink:href", "#sphere");

//     svg.append("path")
//         .datum(graticule)
//         .attr("class", "graticule")
//         .attr("d", path);

//     //d3.json("http://bl.ocks.org/mbostock/raw/4090846/world-50m.json", function(error, world) {

//       svg.insert("path", ".graticule")
//           .datum(topojson.feature(world50m, world50m.objects.land))
//           .attr("class", "land")
//           .attr("d", path);

//       svg.insert("path", ".graticule")
//           .datum(topojson.mesh(world50m, world50m.objects.countries, function(a, b) { return a !== b; }))
//           .attr("class", "boundary")
//           .attr("d", path);
//     //});

//     earth.style("height", height + "px");
//   },

//   randomMovieId: function() {

//   }


// });