import fs from 'fs';
import path from 'path';
import { transform as defaultEsbuildTransform } from 'esbuild';
import { getOptions } from 'loader-utils';
import JoyCon from 'joycon';
import JSON5 from 'json5';
const joycon = new JoyCon();
joycon.addLoader({
    test: /\.json$/,
    async load(filePath) {
        try {
            const config = fs.readFileSync(filePath, 'utf8');
            return JSON5.parse(config);
        }
        catch (error) {
            throw new Error(`Failed to parse tsconfig at ${path.relative(process.cwd(), filePath)}: ${error.message}`);
        }
    },
});
const isTsExtensionPtrn = /\.ts$/i;
let tsConfig;
async function ESBuildLoader(source) {
    var _a, _b, _c;
    const done = this.async();
    const options = getOptions(this);
    const { implementation, ...esbuildTransformOptions } = options;
    if (implementation && typeof implementation.transform !== 'function') {
        done(new TypeError(`esbuild-loader: options.implementation.transform must be an ESBuild transform function. Received ${typeof implementation.transform}`));
        return;
    }
    const transform = (_a = implementation === null || implementation === void 0 ? void 0 : implementation.transform) !== null && _a !== void 0 ? _a : defaultEsbuildTransform;
    const transformOptions = {
        ...esbuildTransformOptions,
        target: (_b = options.target) !== null && _b !== void 0 ? _b : 'es2015',
        loader: (_c = options.loader) !== null && _c !== void 0 ? _c : 'js',
        sourcemap: this.sourceMap,
        sourcefile: this.resourcePath,
    };
    if (!('tsconfigRaw' in transformOptions)) {
        if (!tsConfig) {
            tsConfig = await joycon.load(['tsconfig.json']);
        }
        if (tsConfig.data) {
            transformOptions.tsconfigRaw = tsConfig.data;
        }
    }
    // https://github.com/privatenumber/esbuild-loader/pull/107
    if (transformOptions.loader === 'tsx'
        && isTsExtensionPtrn.test(this.resourcePath)) {
        transformOptions.loader = 'ts';
    }
    try {
        const { code, map } = await transform(source, transformOptions);
        done(null, code, map && JSON.parse(map));
    }
    catch (error) {
        done(error);
    }
}
export default ESBuildLoader;
