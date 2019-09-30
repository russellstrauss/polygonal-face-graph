module.exports = function() {
	
	var renderer, scene, camera, controls, floor;
	var raycaster = new THREE.Raycaster();
	var polyloop = [];
	var mouse = new THREE.Vector2();
	var stats = new Stats();
	var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x08CDFA });
	var adding = false;
	var black = new THREE.Color('black');
	var arrowHelper;
	
	return {
		
		settings: {
			defaultCameraLocation: {
				x: 0,
				y: 75,
				z: 0
			},
			messageDuration: 2000
		},
		
		init: function() {

			let self = this;
			self.loadFont();
		},
		
		begin: function() {
			
			let self = this;
			
			scene = gfx.setUpScene(scene);
			renderer = gfx.setUpRenderer(renderer);
			camera = gfx.setUpCamera(camera);
			floor = gfx.addFloor(scene);
			gfx.enableStats(stats);
			controls = gfx.enableControls(controls, renderer, camera);
			gfx.resizeRendererOnWindowResize(renderer, camera);
			gfx.setUpLights(scene);
			gfx.setCameraLocation(camera, self.settings.defaultCameraLocation);
			self.setUpButtons();
			
			var animate = function() {

				requestAnimationFrame(animate);
				renderer.render(scene, camera);
				controls.update();
				stats.update();
				
				//geometry.verticesNeedUpdate = true;
			};
			
			animate(); 
		},
		
		loadFont: function() {
			
			let self = this;
			let loader = new THREE.FontLoader();
			let fontPath = '';
			fontPath = 'assets/vendors/js/three.js/examples/fonts/helvetiker_regular.typeface.json';

			loader.load(fontPath, function(font) { // success event
				
				if (gfx.appSettings.errorLogging) console.log('Fonts loaded successfully.');
				gfx.appSettings.font.fontStyle.font = font;
				
				self.begin();
				if (gfx.appSettings.axesHelper.activateAxesHelper) gfx.labelAxes(scene);
			},
			function(event) { // in progress event.
				if (gfx.appSettings.errorLogging) console.log('Attempting to load font JSON now...');
			},
			function(event) { // error event
				
				if (gfx.appSettings.errorLogging) console.log('Error loading fonts. Webserver required due to CORS policy.');
				gfx.appSettings.font.enable = false;
				self.begin();
			});
		},
		
		addPoint: function(event) {
			
			event.preventDefault();
			raycaster.setFromCamera(mouse, camera);

			let objects = [];
			objects.push(floor);
			var intersects = raycaster.intersectObjects(objects, true);
			
			if (intersects.length > 0) {
				intersects[0].point.set(intersects[0].point.x, 0, intersects[0].point.z);
				gfx.showPoint(intersects[0].point, scene, black);
				polyloop.push(intersects[0].point);
				
				if (polyloop.length > 1) this.addLine(polyloop[polyloop.length - 2], polyloop[polyloop.length - 1]);
				
				return intersects[0].point;
			}
		},
		
		
		addLine: function(pt1, pt2) {
			
			var lineDashedMaterial = new THREE.LineDashedMaterial({
				color: 0x000000,
				linewidth: 1,
				scale: 1,
				dashSize: 1,
				gapSize: 1,
			});
			//let material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
			let geometry = new THREE.Geometry();
			geometry.vertices.push(new THREE.Vector3( pt1.x, pt1.y, pt1.z) );
			geometry.vertices.push(new THREE.Vector3( pt2.x, pt2.y, pt2.z) );
			let line = new THREE.Line( geometry, lineDashedMaterial );
			line.computeLineDistances();
			scene.add( line );
		},
		
		setUpButtons: function() {
			
			let self = this;
			let message = document.getElementById('message');
			
			let esc = 27;
			let A = 65;
			
			document.addEventListener('keydown', function(event) {
				
				if (event.keyCode === A) {
					adding = true;
					controls.enabled = false;
				}
			});
			
			document.addEventListener('keyup', function(event) {

				if (event.keyCode === A) {
					adding = false;
					controls.enabled = true;
				}
			});
			
			let onMouseMove = function(event) {

				mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
			};
			window.addEventListener('mousemove', onMouseMove, false);
			
			document.querySelector('canvas').addEventListener('click', function(event) {
				
				if (adding) {
					self.addPoint(event);
				}
			});
		}
	}
}