import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'antd/dist/antd.css';
import * as serviceWorker from './serviceWorker';
import App from './App'
import store from './store/index.js'

import { createStore} from 'redux'
import { Provider } from 'react-redux'
import { DndProvider } from 'react-dnd'
import Backend from 'react-dnd-html5-backend'

function Index() {
	return (
		<Provider store={createStore(store)}>
			<DndProvider backend={Backend}>
				    <App />
			</DndProvider>
		</Provider>		
	)
}

ReactDOM.render(<Index/> , document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
