(function(window){
  // Lightweight local shim of the SVG World Map demo.
  // Exposes window.svgWorldMap = async function(options) { ... }
  function createSVG(container, options){
    container.innerHTML = '';
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS,'svg');
    svg.setAttribute('viewBox','0 0 1200 600');
    svg.setAttribute('width','100%');
    svg.setAttribute('height','100%');
    svg.style.display='block';
    svg.style.maxHeight='100%';

    var rect = document.createElementNS(svgNS,'rect');
    rect.setAttribute('width','1200'); rect.setAttribute('height','600'); rect.setAttribute('fill','#2ec4b6');
    svg.appendChild(rect);

    var makeLand = function(id,d){
      var p = document.createElementNS(svgNS,'path');
      p.setAttribute('d',d);
      p.setAttribute('fill','#ffd166');
      p.setAttribute('stroke','#8338ec');
      p.setAttribute('stroke-width','0.6');
      p.setAttribute('data-id',id);
      p.style.cursor='pointer';
      p.addEventListener('click', function(){
        try{
          var cbName = options && options.mapClick ? options.mapClick : '__WMMAP_mapClick';
          if(window[cbName]) window[cbName](id);
        }catch(e){console.warn(e);}        
      });
      return p;
    };

    // simplified shapes (matching SvgWorldMap.tsx ids)
    var shapes = [
      ['EUROPE','M420 140 C 430 120 460 110 490 120 C 520 130 540 150 560 160 C 580 170 600 175 620 170 C 640 165 660 155 680 150 C 700 145 720 150 740 160 C 760 170 780 190 800 200 L 820 210 L 820 240 L 800 250 L 780 240 L 760 230 L 740 220 L 720 215 L 700 210 L 680 205 L 660 200 L 640 198 L 620 196 L 600 194 L 580 190 L 560 185 L 540 178 L 520 172 L 500 168 L 480 160 L 460 152 Z'],
      ['AFRICA','M520 200 C 540 215 560 240 580 270 C 600 300 620 330 640 360 C 660 390 680 420 700 430 L 700 460 L 680 480 L 660 470 C 640 460 620 440 600 420 C 580 400 560 380 540 360 C 520 340 500 320 480 300 C 460 280 450 250 460 230 C 470 220 490 210 510 200 Z'],
      ['N_AMERICA','M130 80 C 160 60 200 60 240 80 C 280 100 320 130 360 150 C 400 170 440 190 470 220 L 480 240 L 480 260 L 460 270 L 440 260 C 420 250 400 240 380 230 C 360 220 340 210 320 200 C 300 190 280 180 260 170 C 240 160 200 140 170 120 C 150 105 140 92 130 80 Z'],
      ['S_AMERICA','M300 300 C 320 320 350 340 380 360 C 410 380 440 400 460 430 C 480 460 500 500 520 530 L 500 540 C 480 525 450 500 430 470 C 410 440 390 410 370 380 C 350 350 330 320 310 300 Z'],
      ['ASIA','M660 80 C 700 70 740 70 780 90 C 820 110 860 140 900 160 C 940 180 980 200 1000 220 L 1000 260 L 980 270 L 960 260 C 940 250 920 240 900 230 C 880 220 860 210 840 200 C 820 190 800 185 780 184 C 760 183 740 185 720 190 C 700 195 680 200 660 205 Z'],
      ['AUSTRALIA','M920 380 C 940 370 960 360 980 362 C 1000 364 1020 380 1040 400 C 1060 420 1040 440 1020 450 C 1000 460 980 460 960 452 C 940 444 920 430 900 414 C 920 404 900 390 920 380 Z']
    ];

    shapes.forEach(function(s){ svg.appendChild(makeLand(s[0],s[1])); });

    container.appendChild(svg);
    return { worldMap: svg, reset: function(){ container.innerHTML=''; } };
  }

  window.svgWorldMap = function(options){
    return new Promise(function(resolve){
      var libPath = (options && options.libPath) ? options.libPath : '/';
      // find the container
      var container = document.getElementById('svg-world-map-container');
      if(!container){
        // create a fallback container in body
        container = document.createElement('div');
        container.id = 'svg-world-map-container';
        container.style.width='100%'; container.style.height='300px';
        document.body.appendChild(container);
      }
      // optionally set background image
      if(options && options.backgroundImage){
        container.style.backgroundImage = 'url("'+options.backgroundImage+'")';
        container.style.backgroundSize = 'cover';
      }
      // create svg
      var inst = createSVG(container, options || {});
      // small delay to mimic async init
      setTimeout(function(){ resolve(inst); }, 50);
    });
  };
})(window);
