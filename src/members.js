import React from "react"
import lodash from "lodash"
import styled from "styled-components"
import dayjs from "dayjs"
import axios from "axios"
import {Page, Prompt, Caret, Waiter, Text, Blank, Block, Box, Arrow, Typer} from "./components"
import {Link, useParams} from "react-router-dom"
import {atom, selector, useRecoilValue, selectorFamily} from "recoil"
import {Address, fromNano, toNano} from "ton-core"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  AreaChart,
  Area, ComposedChart
} from "recharts"
import {stake, withdraw} from "staker-ton/src"
import * as types from "staker-ton/src/types"
import {useTonhubConnect} from "react-ton-x"

export const
  loadMember = selectorFamily({
    key: "member",
    get: ({pool, address}) => async () => {
      let
        {data} = await axios.get(`/api/member/${pool}/${address}`),
        member = types.Member.decode(data.member).right
      member.actions = types.Transactions.decode(data.actions).right
      member.pool = types.Pool.decode(data.pool).right
      return member
    }
  }),
  BalanceChart = ({member}) => {
    let
      value = 0n,
      data = []

    member.actions.forEach((action) => {
      if (stake(action)) {
        value += action.messages[0].value
      }
      if (withdraw(action)) {
        value -= action.messages[1].value
        if (value < 0n) value = 0n
      }
      data.push({
        date: dayjs.unix(action.time).toDate().getTime(),
        value: parseFloat(fromNano(value))
      })
    })
    data.push({
      date: dayjs().toDate().getTime(),
      value: parseFloat(fromNano((member.balance + member.pendingDeposit + member.pendingWithdraw + member.withdraw)))
    })

    return <ResponsiveContainer width={"100%"} height={256}>
      <LineChart data={data}>
        <Line animationBegin={2400} type={"monotone"} dataKey={"value"} strokeWidth={3} stroke={"var(--palette-41)"} />
      </LineChart>
    </ResponsiveContainer>
  },
  MemberDetails = ({address, pool}) => {
    const
      member = useRecoilValue(loadMember({address: address.toString(), pool: pool.toString()})),
      staked = member.actions.filter(stake).reduce((amount, action) => action.messages[0].value + amount, 0n),
      withdrawn = member.actions.filter(withdraw).reduce((amount, action) => action.messages[1].value + amount, 0n),
      months = member.actions.length ? dayjs().diff(dayjs.unix(member.actions[0].time), "month", true) : 0,
      profit = member.balance + withdrawn - staked,
      monthly = months > 1 ?  profit / BigInt(Math.floor(months)) : 0n
    return <section>
      <Typer>
        <Box><h5>[{member.pool.name}]: {member.address.toShortString()}</h5></Box>
        <Blank />
        <Box>current balance: <q>{member.balance.format(8)}</q></Box>
        <Box>total deposited: <q>{staked.format(8)}</q></Box>
        <Box>total withdrawn: <q>{withdrawn.format(8)}</q></Box>
      </Typer>
      <BalanceChart member={member} />
      <Blank />
      <Typer delay={2500}>
        {months > .5 && <Box><h4>all time profit:</h4> <q>{profit.format(8)}</q></Box>}
        {months > 1 &&  <Box><h4>about per month:</h4> <q>{monthly.format(8)}</q></Box>}
        <Blank />
        <Box><h3>History:</h3></Box>
        {lodash.sortBy(member.actions, "time").reverse().map(action => <Action key={`action-${action._id}`} tx={action} />)}
        <Blank />
        <Arrow><Link to={`/e/${pool.toString()}`}>pool --about</Link></Arrow>
        <Arrow><Link to={`/e`}>pool --list</Link></Arrow>
      </Typer>
    </section>
  },
  Action = ({tx}) => {
    return <Box>
      <time>{dayjs.unix(tx.time).format("DD/MM/YY HH:mm")}</time>&nbsp;
      {stake(tx) ?
        <Text color={71}>deposited</Text> :
        <Text color={21}>withdrawn</Text>
      }&nbsp;
      <Text><q>{stake(tx) ? tx.messages[0].value.format(2) : tx.messages[1].value.format(2)}</q></Text>
    </Box>
  },
  ExtensionMember = () => {
    const
      params = useParams(),
      pool = Address.from(params.pool),
      connection = ! (location.hostname === "localhost" || location.hostname[0] === "1")  ? useTonhubConnect() : {
      // connection = {
        state: {
          type: "online",
          address: Address.from("EQAeypInfuB1xdFMHJUZ9tYKj0nFU0vFS9lt8-SL2ptSXl_9"),
        }
      }
    return <Page>
        <Prompt>wallet --pool {pool.toShortString()}</Prompt>
        <React.Suspense fallback={<Waiter />}>
          <MemberDetails address={connection.state.address} pool={pool} />
          <Caret />
        </React.Suspense>
    </Page>
  }