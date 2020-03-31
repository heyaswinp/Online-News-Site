import React, {Component} from 'react';
import Header from '../common/header';
import Footer from '../common/footer';
import Navigation from '../common/navigation';
import IsEditorCheck from '../common/isEditorCheck';

class Landing extends Component {

    render(){

        return(
            <div>
                <IsEditorCheck />
                {/* <!-- Card with information --> */}
                <div class="bg-white pl-5 pr-5 pb-5">
                    <Header />
                    <Navigation />
                    
                    <h1>EDIT ARTICLE</h1>

                    <Footer />
                </div>
            </div>
        )
    }
}
//export Landing Component
export default Landing;