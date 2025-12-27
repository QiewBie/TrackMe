
import * as ReactWindow from 'react-window';
console.log('Keys:', Object.keys(ReactWindow));
try {
    console.log('List:', ReactWindow.List ? 'Exists' : 'Missing');
    console.log('FixedSizeList:', ReactWindow.FixedSizeList ? 'Exists' : 'Missing');
    console.log('VariableSizeList:', ReactWindow.VariableSizeList ? 'Exists' : 'Missing');
} catch (e) {
    console.error(e);
}
