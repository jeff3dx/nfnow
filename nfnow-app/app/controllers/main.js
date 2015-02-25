/* globals $, d3, topojson */

import Ember from 'ember';
import { world50m } from 'netflix-now/controllers/world50m';

function secs(n) {
  return 1000 * n;
}


//var HOST = "http://localhost:2001/";
var HOST = "";
var EVENTS_URL = HOST + "api/events";
var MOVIES_URL = HOST + "api/videos?mids=%@";


export default Ember.Controller.extend({

  queryParams: ['lifeSpan', 'fetchSpeed'],
  classNames: ['earth'],

  lifeSpan: 5000,      // dots hang around this many ms
  zoom: 1000,           // time for each sample to zoom in
  fade: 750,            // time for each sample to fade out
  fetchSpeed: 5000,     // ms between each server call to get new data

  plotSpeed: function() {
    var factor = this.get('fetchSpeed') / 150;  // 50 samples X 3 regions + 30% overlap
    factor = factor + (factor * 0.3);
    return factor;
  }.property('fetchSpeed'),


  topTitleWidth: 300,
  topTitleHeight: 300,
  topTitleBarWidth: 100,

  existingArt: {},
  samples: [],
  tally: {},

  hoverTitle: '',
  hoverImageSrc: '',
  hoverStyle: '',

  showBoxart: false,
  showDots: true,
  showTop10: false,


  topTitlesStyle: function() {
    if(this.get('showTop10')) {
      return "display: block;";
    } else {
      return "display: none;";
    }
  }.property('showTop10'),


  sendServerRequest: function(query, fn) {
    $.support.cors = true;

    $.ajax({
      url: query,
      type: 'post',
      dataType: 'json',
      headers: {'Access-Control-Allow-Origin': '*' },

      success: function(data) {
        fn(data);
      }
    });
  },

  // prod
  requestEventData: function(fn) {
    var self = this;
    self.sendServerRequest(EVENTS_URL, function(data) {
      fn(data);
    });
  },

  requestMovieData: function(needed, fn) {
    var self = this;
    var query = MOVIES_URL.fmt(needed);

    self.sendServerRequest(query, function(data) {
      fn(data);
    });
  },


  onMouseEnter: function(d, i, d3event, el, self) {
    var x = d3event.pageX;
    var y = d3event.pageY;
    Ember.run(function() {
      self.set('hoverImageSrc', d.sample.artUrl);
      self.set('hoverTitle', d.sample.title);
      self.positionHover(x, y, self);
    });
  },

  onMouseMove: function(d, i, d3event, el, self) {
    var x = d3event.pageX;
    var y = d3event.pageY;
    Ember.run(function() {
      self.positionHover(x, y, self);
    });
  },

  onMouseLeave: function(d, i, d3event, el, self) {
    Ember.run(function() {
      var style = 'visibility: hidden;';
      self.set('hoverStyle', style);
    });
  },

  positionHover: function(x, y, self) {
    Ember.run(function() {
      var style;
      // if(y < 200) {
        style = 'left: %@px; top:%@px; visibility: visible;'.fmt(x - 110, y + 50);
      // } else {
      //   style = 'left: %@px; top:%@px; visibility: visible;'.fmt(x - 110, y - 180);
      // }
      self.set('hoverStyle', style);
    });
  },

  onClick: function(d) {
    window.open('http://www.netflix.com/WiPlayer?movieid=' + d.mid);
  },

  doTally: function() {
    var samples = this.get('samples');
    var tally = {};
    var keep = [];
    var limit = Date.now() - secs(180); // 3 min

    samples.forEach(function(d) {
      if(d.date >= limit) {
        keep.push(d);
      }
    });
    samples = keep;

    keep.forEach(function(d) {
      if(d.mid in tally) {
        tally[d.mid].count += 1;
      } else {
        tally[d.mid] = { count: 1, sample: d };
      }
    });
    this.topTitles(tally);

  },


  // Updates the top titles bar graph
  topTitles: function(tally) {
    var self = this;
    var width = 575;
    var height = 240;
    var barWidth = 40;
    var artSize = 50;
    var padLeft = 10;
    var maxBars = 10;
    var gap = 15;
    var speed = 1000;

    var sorted = Object.keys(tally).map(function(mid) {
      return {
        mid: mid,
        rank: 0,
        count: tally[mid].count,
        date: tally[mid].sample.date,
        sample: tally[mid].sample
      };
    });

    sorted.sort(function(a,b) {
      if( b.count === a.count ) {
        return b.date - a.date;
      }
      return b.count - a.count;
    });

    sorted.forEach(function(d, i) {
      d.rank = i;
    });

    var len = sorted.length;
    if(len > maxBars) {
      sorted.splice(maxBars, len - maxBars);
    }

    function xscale(x) {
      return (x * barWidth) + (gap * x) + padLeft;
    }

    var yscale = d3.scale.linear()
      .domain([0, Math.max(3, d3.max(sorted, function(d) { return d.count; }))])
      .range([0, height]);

    var svg = d3.select('div.top-titles svg')
      .attr('width', width)
      .attr('height', height);

    // bind data
    var updateBar = svg.selectAll('rect')
      .data(sorted, function(d) {
        return d.mid;
      });

    var updateArt = svg.selectAll('image')
      .data(sorted, function(d) {
        return d.mid;
      });

    // drop off
    updateBar.exit().remove();
    updateArt.exit().remove();

    // add bar
    updateBar.enter().append('rect')
      .attr('x', function(d) { return xscale(d.rank); })
      .attr('y', function(d) { return height - yscale(d.count); })
      .attr('width', barWidth)
      .attr('height', function(d) { return yscale(d.count); })
      .attr('title', function(d) { return d.sample.title; })
      .style('opacity', 0)
      .on('mouseenter', function(d, i) { self.onMouseEnter(d, i, d3.event, this, self); } )
      .on('mousemove', function(d, i) { self.onMouseMove(d, i, d3.event, this, self); } )
      .on('mouseleave', function(d, i) { self.onMouseLeave(d, i, d3.event, this, self); } )
      .on('click', self.onClick);

    // add art
    updateArt.enter().append('image')
      .attr('title', function(d) { return d.sample.title; })
      .attr('x', function(d) { return xscale(d.rank) - 5; })
      .attr('y', function(d) {
        var y = height - yscale(d.count) - 12;
        return Math.min(y, height - artSize);
      })
      .attr('width', barWidth + 10)
      .attr('height', artSize)
      .attr('xlink:href', function(d) { return d.sample.artUrl; })
      .style('opacity', 0)
      .on('mouseenter', function(d, i) { self.onMouseEnter(d, i, d3.event, this, self); } )
      .on('mousemove', function(d, i) { self.onMouseMove(d, i, d3.event, this, self); } )
      .on('mouseleave', function(d, i) { self.onMouseLeave(d, i, d3.event, this, self); } )
      .on('click', self.onClick);


    // update existing bar
    updateBar.transition().duration(speed)
      .attr('x', function(d) { return xscale(d.rank); })
      .attr('y', function(d) { return height - yscale(d.count); })
      .attr('height', function(d) { return yscale(d.count); })
      .style('opacity', 0.7);

    // update existing art
    updateArt.transition().duration(speed)
      .attr('x', function(d) { return xscale(d.rank) - 5; })
      .attr('y', function(d) {
        var y = height - yscale(d.count) - 12;
        return Math.min(y, height - artSize);
      })
      .style('opacity', 1);
  },

  willDestroyElement: function() {
    clearInterval(this.timer);
  },

  _setup: function() {
    Ember.run.scheduleOnce('afterRender', this, this.startPoll);
  }.on('init'),

  timer: null,
  startPoll: function() {
    var self = this;

    this.drawGlobe();

    self.getMoreSamples();
    self.timer = setInterval(function() {
      self.getMoreSamples();
    }, this.get('fetchSpeed'));
  },


  getMoreSamples: function() {
    var self = this;

    self.requestEventData(function(msg) {
      // parse data
      var dataCount = msg.data.length;
      var allParsed = [];
      var parsed;


      for(var k=0; k<dataCount; k++) {
        if(msg.data[k] !== null) {
          parsed = JSON.parse(msg.data[k]);
          parsed.size = parsed.events.length;
          allParsed.push(parsed);
        }
      }

      //interleave data
      var all = [];
      var parsedLen = allParsed.length;
      var max = d3.max(allParsed, function(d) { return d.size; });

      for(var i=0; i<max; i++) {
        for(var j=0; j<parsedLen; j++) {
          if(allParsed[j].size > i) {
            all.push(allParsed[j].events[i]);
          }
        }
      }

      // needed art
      var samples = self.get('samples');
      var existingArt = self.get('existingArt');
      var neededArt = [];

      all.forEach(function(d) {
        var mid = d.content['mid'];
        if(!(mid in existingArt)) {
          neededArt.push(mid);
        }
      });

      var needed = neededArt.join();

      // get art
      self.requestMovieData(needed, function(artResp) {

        if(!Array.isArray(artResp)) {
          artResp = [artResp];
        }

        artResp.forEach(function(elem) {
          elem.data.forEach(function(d) {
            if(d.artworks.length > 0) {
              existingArt[d.id] = {
                title: d.title,
                artUrl: d.artworks[0].url
              };
            }
          });
        });

        all.forEach(function(d, i) {
          var artUrl, artTitle;

          if(!existingArt[d.content['mid']]) {
            artUrl = null;
            artTitle = null;
          } else {
            artUrl = existingArt[d.content['mid']].artUrl;
            artTitle = existingArt[d.content['mid']].title;
          }

          var sample = {
              mid: d.content['mid'],
              date: Date.now(),
              title: artTitle,
              artUrl: artUrl,
              lng: d.content["geo.longitude"],
              lat: d.content["geo.latitude"],
          };
          samples.push(sample);


          (function plot(sample, i) {
            setTimeout(function() {

              if(self.get('showBoxart')) {
                self.plotSample(sample);
              }

              if(self.get('showDots')) {
                self.plotSampleAsDot(sample);
              }

            }, i * self.get('plotSpeed'));
          })(sample, i);

          // update bar graph every 10 samples
          if(i % 10 === 0) {
            (function plot(i) {
              setTimeout(function() {
                self.doTally();
              }, i * self.get('plotSpeed'));
            })(i);
          }

        });

      }); // get art
    }); // get events
  },

  projection: null,
  svg: null,

  plotSample: function(sample) {
    if(sample.artUrl === null) {
      return;
    }

    var projection = this.get('projection');
    var svg = this.get('svg');

    var width = 50;
    var height = 50;
    var xy = projection([sample.lng, sample.lat]);

    var image = svg.append('image')
      .attr('x', xy[0])
      .attr('y', xy[1])
      .attr('width', 1)
      .attr('height', 1)
      .style('opacity', 1)
      .attr('xlink:href', sample.artUrl)
      .attr('title', sample.title);

    image.transition().duration(this.get('zoom'))
      .attr('x', xy[0] - (width / 2))
      .attr('y', xy[1] - (height /2))
      .attr('width', width)
      .attr('height', height)
        .transition().duration(this.get('fade'))
        .style('opacity', 0)
          .transition(1)
          .remove();
  },


  plotSampleAsDot: function(sample) {
    var self = this;
    var projection = this.get('projection');
    var svg = this.get('svg');

    var width = 20;
    var height = 20;
    var xy = projection([sample.lng, sample.lat]);

    var image = svg.append('image')
      .attr('x', xy[0])
      .attr('y', xy[1])
      .attr('width', 1)
      .attr('height', 1)
      .style('opacity', 1)
      .attr('xlink:href', 'assets/images/yellowdot.png')
      .attr('title', sample.title);

    image.transition().duration(500)    // dot fades in
      .attr('x', xy[0] - (width / 2))
      .attr('y', xy[1] - (height /2))
      .attr('width', width)
      .attr('height', height)

      .transition()
        .delay(self.get('lifeSpan'))   // dot hangs around
        .duration(5000) // dot fades out
          .style('opacity', 0)

            // this chains remove to happen after the fade above
            .transition(1)
            .remove();
  },


  drawGlobe: function() {
    var width = 1400,
        height = 1300;

    var scale = (width + 1) / 2 / Math.PI;
    scale = scale * 2;

    var x = width / 2;
    var y = height / 2;

    x = x * 1.5;
    y = y * 1.2;

    var projection = d3.geo.mercator()
        .scale(scale)
        .translate([x, y])
        .precision(0.1);

    this.projection = projection;

    var path = d3.geo.path()
        .projection(projection);

    var graticule = d3.geo.graticule();

    var earth = d3.select('div.earth');

    var svg = earth.append("svg")
        .attr("width", width)
        .attr("height", height);
    this.svg = svg;

    svg.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

    svg.append("use")
        .attr("class", "stroke")
        .attr("xlink:href", "#sphere");

    svg.append("use")
        .attr("class", "fill")
        .attr("xlink:href", "#sphere");

    svg.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);

    //d3.json("http://bl.ocks.org/mbostock/raw/4090846/world-50m.json", function(error, world) {

      svg.insert("path", ".graticule")
          .datum(topojson.feature(world50m, world50m.objects.land))
          .attr("class", "land")
          .attr("d", path);

      svg.insert("path", ".graticule")
          .datum(topojson.mesh(world50m, world50m.objects.countries, function(a, b) { return a !== b; }))
          .attr("class", "boundary")
          .attr("d", path);
    //});

    earth.style("height", height + "px");
  },

  randomMovieId: function() {

  }


});