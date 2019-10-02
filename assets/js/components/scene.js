module.exports = function() {
	
	var renderer, scene, camera, controls, floor;
	var raycaster = new THREE.Raycaster();
	var black = new THREE.Color('black');
	var white = new THREE.Color('white');
	var green = new THREE.Color(0x00ff00);
	var blackMaterial = new THREE.MeshBasicMaterial({ color: black });
	var greenMaterial = new THREE.MeshBasicMaterial({ color: green });
	var arrows = [];
	var mouse = new THREE.Vector2();
	var stats = new Stats();
	var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x08CDFA });
	var adding = false;
	var arrowHelper;
	var previousArrowPoint;
	
	return {
		
		settings: {
			defaultCameraLocation: {
				x: 0,
				y: 75,
				z: 0
			},
			messageDuration: 2000,
			arrowHeadSize: 1.5,
			colors: {
				worldColor: black,
				gridColor: green,
				arrowColor: white
			}
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
			floor = gfx.addFloor(scene, this.settings.colors.worldColor, this.settings.colors.gridColor);
			gfx.enableStats(stats);
			controls = gfx.enableControls(controls, renderer, camera);
			gfx.resizeRendererOnWindowResize(renderer, camera);
			gfx.setUpLights(scene);
			gfx.setCameraLocation(camera, self.settings.defaultCameraLocation);
			self.setUpButtons();
			self.sandbox();
			
			var animate = function() {

				requestAnimationFrame(animate);
				renderer.render(scene, camera);
				controls.update();
				stats.update();
				
				//geometry.verticesNeedUpdate = true;
			};
			
			animate(); 
		},
		
		sandbox: function() {
			// let line1 = this.addLine(new THREE.Vector3(-30, 0, -30), new THREE.Vector3(30, 0, 30));
			// let line2 = this.addLine(new THREE.Vector3(-30, 0, 30), new THREE.Vector3(30, 0, -30));
			// this.intersection(line1, line2);
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
		
		addArrow: function(event) {
			
			event.preventDefault();
			raycaster.setFromCamera(mouse, camera);

			let objects = [];
			objects.push(floor);
			var intersects = raycaster.intersectObjects(objects, true);
			
			if (intersects.length > 0) { // if point clicked intersects with floor
				intersects[0].point.set(intersects[0].point.x, 0, intersects[0].point.z);
				let clickedPoint = intersects[0].point;

				
				if (arrows.length !== 0 && typeof arrows[arrows.length - 1].end === 'undefined') {
					if (previousArrowPoint) scene.remove(previousArrowPoint);
					arrows[arrows.length - 1].end = clickedPoint;
				}
				else {
					previousArrowPoint = gfx.showPoint(clickedPoint, scene, green);
					arrows.push({ start: clickedPoint, end: undefined});
				}
				
				if (typeof arrows[arrows.length - 1].start !== 'undefined' && typeof arrows[arrows.length - 1].end !== 'undefined') {
					gfx.drawLine(arrows[arrows.length - 1].start, arrows[arrows.length - 1].end, scene, this.settings.colors.arrowColor);
					
					// Draw a triangle on the end
					let arrowDirection = gfx.createVector(arrows[arrows.length - 1].start, arrows[arrows.length - 1].end);
					arrowDirection.setLength(this.settings.arrowHeadSize);				
					let tip = gfx.movePoint(arrows[arrows.length - 1].end.clone(), arrowDirection);
					let axis = new THREE.Vector3(0, 1, 0); // rotate a vector around y
					let arrowNormal = arrowDirection.clone().applyAxisAngle(axis, Math.PI / 2);
					arrowNormal.setLength(arrowNormal.length() / 2);
					let left = gfx.movePoint(arrows[arrows.length - 1].end.clone(), arrowNormal);
					arrowNormal = arrowNormal.clone().applyAxisAngle(axis, Math.PI);
					let right = gfx.movePoint(arrows[arrows.length - 1].end.clone(), arrowNormal);
					let arrowHeadGeometry = gfx.createTriangle(tip, left, right);
					let arrowMaterial = new THREE.MeshBasicMaterial({ color: this.settings.colors.arrowColor });
					let arrowHeadMesh = new THREE.Mesh(arrowHeadGeometry, arrowMaterial);
					scene.add(arrowHeadMesh);
				}
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
			let lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
			let geometry = new THREE.Geometry();
			geometry.vertices.push(pt1);
			geometry.vertices.push(pt2);
			let line = new THREE.Line(geometry, lineMaterial);
			line.computeLineDistances(); // needed for dash material
			scene.add(line);
			return line;
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
					self.addArrow(event);
				}
			});
		},
		
		intersection: function(line1, line2) {
			let pt1 = line1.geometry.vertices[0]; let pt2 = line1.geometry.vertices[1];
			let pt3 = line2.geometry.vertices[0]; let pt4 = line2.geometry.vertices[1];
			let lerpLine1 = ((pt4.x - pt3.x) * (pt1.z - pt3.z) - (pt4.z - pt3.z) * (pt1.x - pt3.x)) / ((pt4.z - pt3.z) * (pt2.x - pt1.x) - (pt4.x - pt3.x) * (pt2.z - pt1.z));
			let lerpLine2 = ((pt2.x - pt1.x) * (pt1.z - pt3.z) - (pt2.z - pt1.z) * (pt1.x - pt3.x)) / ((pt4.z - pt3.z) * (pt2.x - pt1.x) - (pt4.x - pt3.x) * (pt2.z - pt1.z));
			
			let x = pt1.x + lerpLine1 * (pt2.x - pt1.x);
			let z = pt1.z + lerpLine1 * (pt2.z - pt1.z);
			gfx.showPoint(new THREE.Vector3(x, 0, z), scene);
		}
	}
}