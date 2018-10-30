#define USE_MAP


attribute float size;
attribute vec3 color;
//uniform Image2D map;

void main(){
	gl_PointsSize = size;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
	gl_FragColor = vec4(color,1.0);
}
