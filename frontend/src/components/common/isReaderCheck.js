import React, { Component } from 'react';
import { Redirect } from 'react-router';

class IsReader extends Component {
	render() {
        let RedirectVar
        if (localStorage.getItem('226UserType') === "Editor") {
            RedirectVar = <Redirect to="/editor" />;
        } else if (!localStorage.getItem('226UserType')) {
            RedirectVar = <Redirect to="/login" />;
        }
        
		return (
			<div>
				{ RedirectVar }
			</div>
		);
	}
}
// export IsReader Component
export default IsReader;