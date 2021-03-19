/// <reference types="minecraft-scripting-types-server" />

import './test';


import { setup } from './src/_entry';
import { createServices } from './src/bdsx-dependencies/dependencies';
setup(createServices());
