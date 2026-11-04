vphy.ThreexKeyboardAccelerator	= vphy.Class({
	__extends__	: vphy.Accelerator,
	__init__	: function(args){
		var params = vphy.extend({
		}, args);
		this.bodies		= params.bodies;
		this.keyboard		= params.keyboard;
		this.acceleration	= params.acceleration;
	},
	perform		: function(){
		var keyboard	= this.keyboard;
		var acc		= this.acceleration;
		var key		= {
			left	: keyboard.pressed('left') || keyboard.pressed('a') || keyboard.pressed('A'),
			right	: keyboard.pressed('right') || keyboard.pressed('d') || keyboard.pressed('D'),
			up	: keyboard.pressed('up') || keyboard.pressed('w') || keyboard.pressed('W'),
			down	: keyboard.pressed('down') || keyboard.pressed('s') || keyboard.pressed('S')
		};
		for(var i = 0; i < this.bodies.length; i++){
			var body	= this.bodies[i];
			if( key.right )	body.accelerate(+acc,0,0);
			if( key.left )	body.accelerate(-acc,0,0);
			if( key.up )	body.accelerate(0,0,-acc);
			if( key.down )	body.accelerate(0,0,+acc);
		}
	}
});
