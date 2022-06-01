import React, { Component } from 'react';
import './App.scss';
import MapPanel from './MapPanel/index'
import QueryPanel from './QueryPanel/index'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
      return (
        <div className="App">
            <div className='map-view' >
              <MapPanel />
            </div>

            <div className='query-view' >
              <QueryPanel />
            </div>
        </div>
      );
    }
}


export default  App
