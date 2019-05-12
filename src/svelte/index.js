const phtml = require('phtml');
const cherow = require('cherow');
const recast = require('recast');
const rehype = require('rehype');
const visit = require('unist-util-visit');
const visitChildren = require('unist-util-visit-children');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const generate = require('@babel/generator').default;
const {parse} = require('@babel/parser');

const reshadow = require('../babel');

const preprocess = {
    async markup({content, filename}) {
        const placeholders = {};

        let script = {attributes: '', content: ''};
        let style = {attributes: '', content: ''};

        let code = content
            .replace(
                /<script(.*?)>(.*)<\/script>/ms,
                (match, attributes, content) => {
                    script = {attributes, content};
                    return '';
                },
            )
            .replace(
                /<style(.*?)>(.*)<\/style>/ms,
                (match, attributes, content) => {
                    style = {attributes, content};
                    return '';
                },
            );

        let [, reshadowImport] =
            script.content.match(
                new RegExp(
                    /import[\s\n\r]+(\w+).*?from[\s\n\r]+['"]reshadow['"]/,
                    'sm',
                ),
            ) || [];

        if (!reshadowImport) {
            if (style.attributes.includes('reshadow')) {
                script.content += `import __styled__ from "reshadow";__styled__\`${style.content.replace(
                    /val\((\w+)\)/gms,
                    '${$1}',
                )}\``;
                reshadowImport = '__styled__';
            } else {
                return {code: content};
            }
        }

        let index = 0;

        code = code
            .replace(/(\{\w+\})/gms, (match, $1) => {
                const id = `__PLACEHOLDER__${index++}__`;
                placeholders[id] = $1;
                return id;
            })
            // replace expressions like (:attr) with (__use__:attr)
            .replace(/([^\]]?[\s\r\n]+):(\w+)/gms, '$1__use__:$2')
            // replace expression name=value with name="__QUOTE__value__QUOTE__"
            .replace(/(\w+)=(\w+)/gms, '$1="__QUOTE__$2__QUOTE__"')
            // svelte syntax
            .replace(/\{([\s\n\r]*)([#:/])/gms, '__BRACKET__$1$2');

        // code = `${
        //     script.content
        // };__reshadow__;${reshadowImport}(<>${code}</>);`;

        // console.log({code});

        console.log(script.content);

        let ast = parse(
            `${
                script.content
            };__reshadow__;${reshadowImport}(__)(<>${code}</>);`,
            {
                sourceType: 'module',
                plugins: ['jsx'],
            },
        );

        // ast = t.file(ast);

        const plugin = reshadow({types: t});

        console.log(
            traverse(ast, {
                ...plugin.visitor,
                Program(path) {
                    return plugin.visitor.Program.enter(path, {
                        opts: {},
                        file: {opts: {filename}, scope: path.scope},
                    });
                },
            }),
        );

        ({code} = generate(ast));

        // const [newScript, markup] = code.replace()

        console.log({code});

        /// /

        // content = content
        //     .replace(new RegExp(/["]/, 'gms'), '\\"')
        //     .replace(/\{/gms, '"$${')
        //     .replace(/\}/gms, '}$$"');

        // console.log({content});

        // const processor = rehype()
        //     .data('settings', {
        //         fragment: true,
        //     })
        //     .use(options => {
        //         return (tree, file) => {
        //             // const visit = visitChildren((node, index, parent) => {
        //             //     if (
        //             //         node.tagName === 'script' ||
        //             //         node.tagName === 'style'
        //             //     ) {
        //             //         parent.children.splice(index, 1);
        //             //     } else {
        //             //         console.log(node);
        //             //     }
        //             // });

        //             visit(tree, 'element', node => {
        //                 console.log({node});
        //             });
        //         };
        //     });

        // let result = await processor.process(content);

        // console.log({result});

        return {code};
    },
};

module.exports = preprocess;
