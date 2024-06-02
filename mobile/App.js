import * as React from 'react';

import MainContainer from './navigation/MainContainer';
import { AuthContext } from './navigation/AuthContext';

const App = () => {
    const [authToken, setAuthToken] = React.useState(null);
    return (
        <AuthContext.Provider value={{ authToken, setAuthToken }}>
            <MainContainer />
        </AuthContext.Provider>
    );
};

export default App;
