const phtml = require('phtml');
const cherow = require('cherow');
const recast = require('recast');
const rehype = require('rehype');
const visit = require('unist-util-visit');
const visitChildren = require('unist-util-visit-children');

const prepare = content => {
    if (!content.includes('reshadow')) {
        return {code: content};
    }

    let script = null;
    let style = null;

    const placeholders = [];

    let code = content
        .replace(
            /<script(.*?)>(.*)<\/script>/ms,
            (match, attributes, content) => {
                script = {attributes, content};
                return '';
            },
        )
        .replace(/<style.*?>(.*)<\/style>/ms, (match, attributes, content) => {
            style = {attributes, content};
            return '';
        })
        .replace(/(<|\s):\{(.*?)\}/gms, '$1use:$2={$2}')
        .replace(/(<|\s)(_|:|\|)/gms, '$1use:')
        .replace(/\{(.*?)\}/gms, (match, value) => {
            const index = placeholders.length;
            placeholders.push(value);
            return `{__PLACEHOLDER__${index}__}`;
        })
        .replace(
            new RegExp(
                `<(\\w+)(([\\r\\n\\s]+)(([:\\w]+=)?\\{\\w+\\}|[:\\w]+=['"].*?['"]|[:\\w]+=\\w+))+>`,
                'gms',
            ),
            (match, tag, between, prop, offset, original) => {
                return match
                    .replace(
                        /([^=])\{(\w+)\}/gms,
                        (match, $1, $2) => `${$1}${$2}={${$2}}`,
                    )
                    .replace(
                        /([:\w]+)=(\w+)/gms,
                        (match, $1, $2) => `${$1}="${$2}"`,
                    );
            },
        );

    return {script, style, content};
};

const {Plugin} = phtml;

const xx = new Plugin('phtml-reshadow', () => {
    return {
        AttributeList(node, result) {
            console.log(node);
        },
    };
});

const preprocess = {
    async markup({content, filename}) {
        // const result = await phtml.use(xx()).process(content, {from: filename});

        // // console.log({result});

        // return {code: content};

        const defaultProcessor = rehype().data('settings', {fragment: true});

        const processor = rehype()
            .data('settings', {
                fragment: true,
            })
            .use(options => {
                return (tree, file) => {
                    const visit = visitChildren((node, index, parent) => {
                        if (
                            node.tagName === 'script' ||
                            node.tagName === 'style'
                        ) {
                            parent.children.splice(index, 1);
                        } else {
                            console.log(node);
                        }
                    });

                    visit(tree);
                };
            });

        const {parse} = processor;

        processor.parse = code => {
            // console.log({code});

            return parse(code);
        };

        let result = await processor.process(content);

        console.log({result});

        return {code: content};
    },
};

module.exports = preprocess;
