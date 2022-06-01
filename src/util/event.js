
/*
	singleton event management
	API refer https://github.com/primus/eventemitter3
*/

import * as  EventEmitter from 'eventemitter3'

export default class Event {
	static instance = null
	constructor(){
		if(!Event.instance){
		 	Event.instance = this
		 	this.ev = new EventEmitter()
		}
		return Event.instance
	}
	static get(){
		let instance =  Event.instance ? Event.instance : new Event()
		return instance.ev
	}
}