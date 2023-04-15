import React from "react"
import styled from "styled-components"
import TypeIt from "typeit-react"
import {useTonhubConnect} from "react-ton-x"
import {Address} from "ton-core";

export const
  Text = styled.span`
    font-weight: ${props => props.bold ? 500 : 300};
    color: var(${props => props.color ? `--palette-${props.color}` : "--palette-01"});
    
    & abbr {}
    & acronym {}
    & blockquote {}
    & dfn {
      white-space: pre;
    }
    & address {}
    & cite {}
    & code {}
    & tt {}
    & del {}
    & ins {}
    & em {}
    & strong {}
    & kbd {}
    & q {}
    & samp {}
    & sub {}
    & sup {}
    & var {}

    & dfn { color: var(--palette-80); }
    & strong { color: var(--palette-60); }
    & em { color: var(--palette-41); }
    & q { color: var(--palette-30); }
    & b { color: var(--palette-40); }
    & time { color: var(--palette-11); }
    
    & h1, & h2, & h3, & h4, & h5, & h6 { display: inline; } 

    & h1 { color: var(--palette-21); }
    & h2 { color: var(--palette-31); }
    & h3 { color: var(--palette-41); }
    & h4 { color: var(--palette-51); }
    & h5 { color: var(--palette-61); }
    & h6 { color: var(--palette-71); }
  `,
  Block = styled(Text)`
    display: block;
    padding-left: ${props => props.tab ? "var(--space-x4)" : undefined};
  `,
  Box = styled(Block)``,
  Caret = styled.span`
    content: "";
    display: inline-block;
    height: 1em;
    width: .5em;
    background: var(--font-color);
    animation: cursor 2s infinite;
    position: relative;
    bottom: -4px;
  `,
  Typer = ({children, delay}) => <TypeIt options={{cursor: false, speed: 1, nextStringDelay: 1, startDelay: delay || 1, }}>{children}</TypeIt>,
  Waiter = () => {
    const
      ticks = ["|", "/", "-", "\\"],
      [tick, settick] = React.useState(0)
    React.useEffect(() => {
      const interval = setInterval(() => settick(tick => tick + 1), 200)
      return () => clearInterval(interval)
    }, [])
    return <div>{ticks[tick % 4]}<Caret /></div>
  },
  Prompt = ({children}) => <div>
    <span style={{fontWeight: "bold"}}>
      <span style={{color: "var(--palette-31)"}}>➜</span>&nbsp;<span style={{color: "var(--palette-71)"}}>$TAKER</span>
      &nbsp;
    </span>
    {children}
  </div>,
  Arrow = ({children}) => <div><span style={{color: "var(--palette-30)"}}>➜</span>&nbsp;{children}</div>,
  Page = ({children}) => {
    const connection = ! (location.hostname === "localhost" || location.hostname[0] === "1") ? useTonhubConnect() : {
      state: {
        type: "online",
        address: Address.from("EQAeypInfuB1xdFMHJUZ9tYKj0nFU0vFS9lt8-SL2ptSXl_9"),
      }
    }
    return <div className={"container"}>
      <Box style={{margin: "var(--space)", fontSize: "calc(var(--font-size) / 1.5)"}}>v{__version__}</Box>
      {connection.state.type !== "online" && <Waiter />}
      {connection.state.type === "online" && children}
    </div>
  },
  Blank = () => <div>&nbsp;</div>