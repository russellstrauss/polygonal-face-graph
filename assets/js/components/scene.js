module.exports = function() {
	
	var renderer, scene, camera, controls, floor;
	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();
	var stats = new Stats();
	var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x08CDFA });
	var shadeMaterial = new THREE.MeshPhongMaterial({
		color: 0x08CDFA,
		side: THREE.DoubleSide,
		opacity: .5,
		transparent: true
	});
	var adding = false;
	var black = new THREE.Color('black');
	var arrowHelper;
	
	return {
		
		settings: {
			defaultCameraLocation: {
				x: -20,
				y: 20,
				z: 20
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
				return intersects[0].point;
			}
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