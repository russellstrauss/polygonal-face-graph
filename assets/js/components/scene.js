module.exports = function() {
	
	var renderer, scene, camera, controls, floor;
	var raycaster = new THREE.Raycaster();
	var black = new THREE.Color('black');
	var white = new THREE.Color('white');
	var green = new THREE.Color(0x00ff00);
	var faceMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color('#00BFFE'), transparent: true, opacity: .5 });
	var greenMaterial = new THREE.MeshBasicMaterial({ color: green });
	var arrows = [];
	var faceGraph = [];
	var mouse = new THREE.Vector2();
	var stats = new Stats();
	var wireframeMaterial = new THREE.MeshBasicMaterial({ wireframe: true, color: 0x08CDFA });
	var adding = false;
	var arrowHelper;
	var previousArrowPoint;
	var bounds = {};
	
	return {
		
		settings: {
			defaultCameraLocation: {
				x: 0,
				y: 50,
				z: 0
			},
			messageDuration: 2000,
			arrowHeadSize: 1.5,
			colors: {
				worldColor: white,
				gridColor: black,
				arrowColor: black
			},
			floorSize: 100,
			zBuffer: .1
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
			floor = gfx.addFloor(this.settings.floorSize, scene, this.settings.colors.worldColor, this.settings.colors.gridColor);
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
		
		// plane.intersectLine ( line : Line3, target : Vector3 ) : Vector3
		// plane.intersectsBox ( box : Box3 ) : Boolean
		// plane.intersectsLine ( line : Line3 ) : Boolean
		
		sandbox: function() {
			
			let self = this;
			bounds.left = this.createLine(new THREE.Vector3(-this.settings.floorSize/2, 0, -this.settings.floorSize/2), new THREE.Vector3(-this.settings.floorSize/2, 0, this.settings.floorSize/2));
			bounds.right = this.createLine(new THREE.Vector3(this.settings.floorSize/2, 0, -this.settings.floorSize/2), new THREE.Vector3(this.settings.floorSize/2, 0, this.settings.floorSize/2));
			bounds.top = this.createLine(new THREE.Vector3(-this.settings.floorSize/2, 0, -this.settings.floorSize/2), new THREE.Vector3(this.settings.floorSize/2, 0, -this.settings.floorSize/2));
			bounds.bottom = this.createLine(new THREE.Vector3(-this.settings.floorSize/2, 0, this.settings.floorSize/2), new THREE.Vector3(this.settings.floorSize/2, 0, this.settings.floorSize/2));
			bounds.bottomRight = new THREE.Vector3(this.settings.floorSize/2, 0, this.settings.floorSize/2);
			bounds.bottomLeft = new THREE.Vector3(-this.settings.floorSize/2, 0, this.settings.floorSize/2);
			bounds.topLeft = new THREE.Vector3(-this.settings.floorSize/2, 0, -this.settings.floorSize/2);
			bounds.topRight = new THREE.Vector3(this.settings.floorSize/2, 0, -this.settings.floorSize/2);
			
			arrows.push({start: new THREE.Vector3(0, self.settings.zBuffer, 0), end: new THREE.Vector3(10, self.settings.zBuffer, 15)});
			arrows.push({start: new THREE.Vector3(-20, self.settings.zBuffer, 10), end: new THREE.Vector3(-10, self.settings.zBuffer, 0)});
			arrows.push({start: new THREE.Vector3(-18, self.settings.zBuffer, 17.5), end: new THREE.Vector3(2, self.settings.zBuffer, 17.5)});
			
			var geometry = new THREE.Geometry();
			
			let faceVertex;
			arrows.forEach(function(arrow, i) {
				
				self.showArrow(arrows[i].start, arrows[i].end, scene);
				gfx.labelPoint(arrows[i].start, 'a' + i.toString(), scene, black);
				arrows[i].line = self.createLine(arrows[i].start, arrows[i].end);
				
				if (typeof arrows[i - 1] !== 'undefined') {
					
					faceVertex = self.intersection(arrows[i].line, arrows[i - 1].line);
					gfx.labelPoint(faceVertex, 'v' + i.toString(), scene, 0xff0000);
					geometry.vertices.push(faceVertex);
					gfx.showPoint(faceVertex, scene, black);
					
					console.log(geometry.vertices.length);
					if (geometry.vertices.length % 3 === 0) { // not logical with current loop
						let face = new THREE.Face3(geometry.vertices.length - 2, geometry.vertices.length - 1, geometry.vertices.length);
						geometry.faces.push(face);
					}
				}
			});
			
			// hard coded
			let face = new THREE.Face3(0, 1, 2);
			geometry.faces.push(face);
			
			console.log(geometry.faces);
			faceVertex = self.intersection(arrows[0].line, arrows[arrows.length - 1].line); // last vertex
			geometry.vertices.push(faceVertex);
			gfx.showPoint(faceVertex, scene, black);
			
			scene.add( new THREE.Mesh( geometry, faceMaterial ) );
		},
		
		findPointsOnBounds: function(line) {
			let result = [];
			let top = this.intersection(line, bounds.top);
			let bottom = this.intersection(line, bounds.bottom);
			let left = this.intersection(line, bounds.left);
			let right = this.intersection(line, bounds.right);
			if (top.x > -this.settings.floorSize/2 && top.y > -this.settings.floorSize/2) {
				result.push(top);
				gfx.showPoint(top, scene);
			}
			if (bottom.x > -this.settings.floorSize/2 + 1 && bottom.y < this.settings.floorSize/2 + 1) {
				result.push(bottom);
				gfx.showPoint(bottom, scene);
			}
			if (left.x > -this.settings.floorSize/2 - 1 && left.y > -this.settings.floorSize/2 - 1) {
				result.push(left);
				gfx.showPoint(left, scene);
			}
			if (right.x < this.settings.floorSize/2 + 1 && right.y < this.settings.floorSize/2 + 1) {
				result.push(right);
				gfx.showPoint(right, scene);
			}
			return result;
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
			
			let self = this;
			event.preventDefault();
			raycaster.setFromCamera(mouse, camera);

			let objects = [];
			objects.push(floor);
			var intersects = raycaster.intersectObjects(objects, true);
			
			if (intersects.length > 0) { // if point clicked intersects with floor
				intersects[0].point.set(intersects[0].point.x, 0, intersects[0].point.z);
				let clickedPoint = intersects[0].point;
				clickedPoint = new THREE.Vector3(clickedPoint.x, self.settings.zBuffer, clickedPoint.z);a

				if (arrows.length !== 0 && typeof arrows[arrows.length - 1].end === 'undefined') {
					if (previousArrowPoint) scene.remove(previousArrowPoint);
					arrows[arrows.length - 1].end = clickedPoint;
				}
				else {
					previousArrowPoint = gfx.showPoint(clickedPoint, scene, green);
					arrows.push({ start: clickedPoint, end: undefined});
				}
				
				if (typeof arrows[arrows.length - 1].start !== 'undefined' && typeof arrows[arrows.length - 1].end !== 'undefined') {
					
					this.showArrow(arrows[arrows.length - 1].start, arrows[arrows.length - 1].end, scene);
				}
			}
		},
		
		showArrow: function(start, end, scene) {
			
			gfx.drawLine(start, end, scene, this.settings.colors.arrowColor);
			// Draw a triangle on the end
			let arrowDirection = gfx.createVector(start, end);
			arrowDirection.setLength(this.settings.arrowHeadSize);				
			let tip = gfx.movePoint(end.clone(), arrowDirection);
			let axis = new THREE.Vector3(0, 1, 0); // rotate a vector around y
			let arrowNormal = arrowDirection.clone().applyAxisAngle(axis, Math.PI / 2);
			arrowNormal.setLength(arrowNormal.length() / 2);
			let left = gfx.movePoint(end.clone(), arrowNormal);
			arrowNormal = arrowNormal.clone().applyAxisAngle(axis, Math.PI);
			let right = gfx.movePoint(end.clone(), arrowNormal);
			let arrowHeadGeometry = gfx.createTriangle(tip, left, right);
			let arrowMaterial = new THREE.MeshBasicMaterial({ color: this.settings.colors.arrowColor });
			let arrowHeadMesh = new THREE.Mesh(arrowHeadGeometry, arrowMaterial);
			scene.add(arrowHeadMesh);
		},
		
		addLine: function(pt1, pt2, color) {
			var lineDashedMaterial = new THREE.LineDashedMaterial({
				color: color,
				linewidth: 1,
				scale: 1,
				dashSize: 1,
				gapSize: 1,
			});
			let lineMaterial = new THREE.LineBasicMaterial({ color: color });
			let geometry = this.createLine(pt1, pt2)
			let line = new THREE.Line(geometry, lineMaterial);
			line.computeLineDistances(); // needed for dash material
			scene.add(line);
		},
		
		createLine: function(pt1, pt2) {
			let geometry = new THREE.Geometry();
			geometry.vertices.push(pt1);
			geometry.vertices.push(pt2);
			return geometry;
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
			
			let pt1 = line1.vertices[0]; let pt2 = line1.vertices[1];
			let pt3 = line2.vertices[0]; let pt4 = line2.vertices[1];
			let lerpLine1 = ((pt4.x - pt3.x) * (pt1.z - pt3.z) - (pt4.z - pt3.z) * (pt1.x - pt3.x)) / ((pt4.z - pt3.z) * (pt2.x - pt1.x) - (pt4.x - pt3.x) * (pt2.z - pt1.z));
			let lerpLine2 = ((pt2.x - pt1.x) * (pt1.z - pt3.z) - (pt2.z - pt1.z) * (pt1.x - pt3.x)) / ((pt4.z - pt3.z) * (pt2.x - pt1.x) - (pt4.x - pt3.x) * (pt2.z - pt1.z));
			
			let x = pt1.x + lerpLine1 * (pt2.x - pt1.x);
			let z = pt1.z + lerpLine1 * (pt2.z - pt1.z);
			//gfx.showPoint(new THREE.Vector3(x, 0, z), scene);
			return new THREE.Vector3(x, 0, z);
		}
	}
}