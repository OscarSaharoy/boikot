import React from "react";
import styled from "styled-components";

import { Stack, WrappingPre } from "./components.jsx";

if( !crypto.randomUUID ) crypto.randomUUID = () => "";

window.addEventListener('beforeunload', e => {
    e.preventDefault();
    e.returnValue = '';
});

const initialState = {
    names: [],
    comment: "",
    sources: {},
    tags: [],
    score: "",
    ownedBy: null,
    logoUrl: "",
    siteUrl: "",
    updatedAt: (new Date()).toISOString(),
    jsondump: "",
};

function tojson(state) {
    const result = { ...state, score: parseFloat(state.score) };
    delete result.jsondump;
    return `"${crypto.randomUUID()}":` +
        JSON.stringify(result, null, 2) + ",";
}

function makeSources(comment, oldSources) {
    const matches = comment.match(/\[(\d+)\]/g) ?? [];
    const keys = matches.map( m => m.match(/\d+/)[0] );
    return keys.reduce( (res,key) =>
        ({...res, [key]: oldSources[key] ?? ""}), {} );
}

const sortSources = setState => () => setState( state => {
    const matches = state.comment.match(/\[(\d+)\]/g) ?? [];
    const keys = matches.map( m => +m.match(/\d+/)[0] );

    if( (new Set(keys)).size !== keys.length ) {
        alert("duplicate source numbers detected!");
        return state;
    }

    const newKeyMap = keys.reduce( (res,key,i) => ({
        ...res,
        [key]: i+1,
    }), {} );

    const newSources = {};
    let newComment = state.comment;
    for( const key of keys ) {
        newComment = newComment.replace(
            `[${key}]`, `[%${newKeyMap[key]}]`
        );
        newSources[newKeyMap[key]] = state.sources[key];
    }
    for( const key of keys ) {
        newComment = newComment.replace(
            `[%${newKeyMap[key]}]`, `[${newKeyMap[key]}]`
        );
    }

    return { ...state, comment: newComment, sources: newSources };
});

const Entry = styled.label`
    display: grid;
    gap: .6rem;
    grid-template-columns: max-content auto;
    align-items: center;
    * {
        padding: 0.2rem 0.4rem;
    }
`;

const ifCtrlC = f => e =>
    (e.ctrlKey || e.metaKey) && e.key == "c" && f();

const copy = text =>
    navigator.clipboard.writeText(text);

export function Jsoner() {
    const [state, setState] = React.useState(initialState);
    const showSources = !!Object.keys(state.sources).length;

    const setNames = e =>
        setState( oldState => ({
            ...oldState,
            names: e.target.value.split(", "),
        }) );

    const setComment = e =>
        setState( oldState => (
            {
                ...oldState,
                comment: e.target.value,
                sources: makeSources(e.target.value, oldState.sources),
            }
        ));

    const setSource = key => e =>
        setState( oldState => ({
            ...oldState,
            sources: {
                ...oldState.sources,
                [key]: e.target.value,
            },
        }) );

    const setTags = e =>
        setState( oldState => ({
            ...oldState,
            tags: e.target.value.split(", "),
        }) );

    const setStateField = fieldName => e =>
        setState( oldState => ({
            ...oldState,
            [fieldName]: e.target.value,
        }) );

    const mergeJSONDump = () => {
        try {
            const newObj = JSON.parse(state.jsondump);
            setState( oldState => ({
                ...oldState,
                ...newObj,
                jsondump: ""
            }) );
        } catch(error) {
            alert("Could not parse JSON 😩");
        }
    };

    return <Stack onKeyDown={ifCtrlC( () => copy(tojson(state)) )}>
        <Entry>
            names + ticker
            <input
                value={state.names.join(", ")}
                onChange={setNames} />
        </Entry>
        <h2> comment </h2>
        <textarea
            style={{ height: "8rem", padding: "0.2rem 0.4rem" }}
            value={state.comment}
            onChange={setComment} />
        { showSources && <h2> sources </h2> }
        { Object.keys(state.sources).map(key =>
            <Entry key={key}>
                {key}
                <input
                    value={state.sources[key]}
                    onChange={setSource(key)} />
            </Entry>
        )}
        { showSources &&
            <button onClick={sortSources(setState)}>
                sort sources
            </button> }
        <div/>
        <Entry>
            tags
            <input
                value={state.tags.join(", ")}
                onChange={setTags} />
        </Entry>
        <Entry>
            score
            <input
                value={state.score}
                onChange={setStateField("score")} />
        </Entry>
        <Entry>
            logoUrl
            <input
                value={state.logoUrl}
                onChange={setStateField("logoUrl")} />
        </Entry>
        <Entry>
            siteUrl
            <input
                value={state.siteUrl}
                onChange={setStateField("siteUrl")} />
        </Entry>
        <h2> jsondump </h2>
        <textarea
            style={{ height: "4rem", padding: "0.2rem 0.4rem" }}
            value={state.jsondump}
            onChange={setStateField("jsondump")} />
        <button onClick={mergeJSONDump}>
            merge 🖇️
        </button>
        <WrappingPre>
            {tojson(state)}
        </WrappingPre>
        <button onClick={() => copy(tojson(state))}>
            copy 📋
        </button>
        <button onClick={() => window.location.reload()}>
            clear 🧽
        </button>
    </Stack>;
}

