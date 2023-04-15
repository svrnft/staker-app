import React from "react"
import styled from "styled-components"
import axios from "axios"
import {Page, Prompt, Caret, Waiter, Text, Blank, Block, Box, Arrow, Typer} from "./components"
import {Link, useParams} from "react-router-dom"
import {atom, selector, useRecoilValue, selectorFamily} from "recoil"
import {Address} from "ton-core"
import * as types from "staker-ton/src/types"
import dayjs from "dayjs"
import {useTonhubConnect} from "react-ton-x"
import {stake, withdraw} from "staker-ton/src";

export const
  loadPool = selectorFamily({
    key: "pool",
    get: address => async () => {
      let
        {data} = await axios.get(`/api/pool/${address}`),
        pool = types.Pool.decode(data).right
      // pool.latest = types.Transactions.decode(data.latest.filter(stake)).right
      return pool
    }
  }),
  loadPools = async () => {
    const {data} = await axios.get(`/api/pool`)
    return types.Pools.decode(data).right
  },
  knownPools = atom({
    key: "pools",
    default: loadPools(),
  }),
  loadExtensionPools = selectorFamily({
    key: "extension-pools",
    get: (member) => async () => {
      const
        {data} = await axios.get(`/api/e/pool/${member}`),
        pools = types.Pools.decode(data).right
      return pools.map(pool => ({
        ...pool,
        member: types.Member.decode(pool.member).right,
        actions: types.Transactions.decode(pool.actions).right
      }))
    }
  }),
  PoolDetails = ({address}) => {
    const
      pool = useRecoilValue(loadPool(address.toString())),
      connection = ! (location.hostname === "localhost" || location.hostname[0] === "1")  ? useTonhubConnect() : {
        state: {
          type: "online",
          address: Address.from("EQAeypInfuB1xdFMHJUZ9tYKj0nFU0vFS9lt8-SL2ptSXl_9"),
        }
      }
    return <Box>
      <Typer>
        <h5>[{pool.name}]</h5>
        <Block tab>
          <Block><dfn>enabled:</dfn> <b>{JSON.stringify(pool.params.enabled)}</b></Block>
          <Block><dfn>immutable:</dfn> <b>{JSON.stringify(! pool.params.updatesEnabled)}</b></Block>
          <Block><dfn>minimal stake:</dfn> <q>{(pool.params.minStake + pool.params.depositFee + pool.params.withdrawFee).format(2)}</q></Block>
          <Block><dfn>receipt fee:</dfn> <q>{(pool.params.receiptPrice).format(2)}</q></Block>
          <Block><dfn>pool fee:</dfn> <q>{parseInt(pool.params.poolFee) / 100}%</q></Block>
        </Block>
        <Blank />
        <Block tab>
          <Block><dfn>balance:</dfn> <q>{(pool.balance.value).format(2)}</q></Block>
          <Block><dfn>stake sent:</dfn> <q>{pool.balance.sent.format(2)}</q></Block>
          <Block><dfn>pending deposits:</dfn> <q>{pool.balance.pendingDeposits.format(2)}</q></Block>
          <Block><dfn>pending withdrawals:</dfn> <q>{pool.balance.pendingWithdraw.format(2)}</q></Block>
          <Block><dfn>ready to withdraw:</dfn> <q>{pool.balance.withdraw.format(2)}</q></Block>
        </Block>
        <Blank />
        <Block tab>
          {/*<Block><dfn>stake at:</dfn> <em>{dayjs.unix(pool.status.proxyStakeAt).format()}</em></Block>*/}
          {/*<Block><dfn>stake until:</dfn> <em>{dayjs.unix(pool.status.proxyStakeUntil).format()}</em></Block>*/}
          <Block><dfn>next cycle in:</dfn> <em>{dayjs.duration(dayjs.unix(pool.status.proxyStakeUntil).diff(dayjs())).format("H [hours] m [minutes]")}</em></Block>
        </Block>
        <Blank />
        <Arrow><Link to={`/e/m/${pool.address.toString()}`}>wallet --show</Link></Arrow>
        <Arrow><Link to={`/e`}>pool --list</Link></Arrow>
      </Typer>
    </Box>
  },  
  ExtensionPool = () => {
    const
      params = useParams(),
      address = Address.from(params.pool)
    return <Page>
      <section>
        <Prompt>pool --about {address.toShortString()}</Prompt>
        <React.Suspense fallback={<Waiter />}>
          <PoolDetails address={address} />
          <Caret />
        </React.Suspense>
      </section>
    </Page>
  },
  ExtensionPoolItem = ({pool, tail}) => {
    console.log(pool)
    let
      staked = pool.actions.filter(stake).reduce((amount, action) => action.messages[0].value + amount, 0n),
      withdrawn = pool.actions.filter(withdraw).reduce((amount, action) => action.messages[1].value + amount, 0n),
      months = pool.actions.length ? dayjs().diff(dayjs.unix(pool.actions[0].time), "month", true) : 0,
      profit = pool.member.balance + withdrawn - staked,
      monthly = months > 1 ?  profit / BigInt(Math.floor(months)) : 0n
    return <Box>
      <h5>[{pool.name}]</h5>
      <Block tab>
        {!! pool.actions.length && <Box>
          <Box><dfn>all time profit:</dfn> <q>{profit.format(2)}</q></Box>
          <Box><dfn>balance:</dfn> <q>{pool.member.balance.format(2)}</q></Box>
          <Box><dfn>staked:</dfn> <q>{staked.format(2)}</q></Box>
          <Box><dfn>withdrawn:</dfn> <q>{withdrawn.format(2)}</q></Box>
          <Blank />
        </Box>}
        <Block><dfn>pool balance:</dfn> <q>{pool.balance.value.format(2)}</q></Block>
        <Block><dfn>minimal deposit:</dfn> <q>{(pool.params.withdrawFee + pool.params.depositFee + pool.params.minStake).format(2)}</q></Block>
        <Block><dfn>fee:</dfn> <q>{parseInt(pool.params.poolFee) / 100}%</q></Block>
        <Blank />
        <Arrow><Link to={`/e/${pool.address.toString()}`}>pool --about</Link></Arrow>
        <Arrow><Link to={`/e/m/${pool.address.toString()}`}>wallet --show</Link></Arrow>
      </Block>
      {(! tail) && <Blank />}
    </Box>
  },
  ExtensionPoolList = ({member}) => {
    let
      pools = useRecoilValue(loadExtensionPools(member.toString())),
      start = new Date().getTime(),
      totalStake = 0n, totalWithdraw = 0n,
      profit = pools.reduce((amount, pool) => {
        let
          staked = pool.actions.filter(stake).reduce((amount, action) => action.messages[0].value + amount, 0n),
          withdrawn = pool.actions.filter(withdraw).reduce((amount, action) => action.messages[1].value + amount, 0n),
          profit = pool.member.balance + withdrawn - staked
        start = Math.min(start, pool.actions[0]?.time)
        totalStake += staked
        totalWithdraw += withdrawn
        return amount + profit
      }, 0n),
      months = profit > 0n ? dayjs().diff(dayjs.unix(start), "month", true) : 0,
      monthly = months > 1 ?  profit / BigInt(Math.floor(months)) : 0n
    return <Typer>
      {(profit > 0n) && <Box>
        <Box><h3>Total profit: {profit.format(2)}</h3></Box>
        {months > 1 && <Box><h3>About per month: {monthly.format(2)}</h3></Box>}
        <Box><h4>Total staked: {totalStake.format(2)}</h4></Box>
        <Box><h4>Total withdrawn: {totalWithdraw.format(2)}</h4></Box>
        <Blank />
      </Box>}
      {pools.map((pool, index) => <ExtensionPoolItem pool={pool} tail={index === (pools.length - 1)} key={`pool-${pool._id}`} />)}
    </Typer>
  },
  ExtensionPools = () => {
    const
      connection = ! (location.hostname === "localhost" || location.hostname[0] === "1")  ? useTonhubConnect() : {
        state: {
          type: "online",
          address: Address.from("EQAeypInfuB1xdFMHJUZ9tYKj0nFU0vFS9lt8-SL2ptSXl_9"),
        }
      }
    return <Page>
      <Prompt>pool --list</Prompt>
      <React.Suspense fallback={<Waiter />}>
        <ExtensionPoolList member={connection.state.address} />
        <Caret />
      </React.Suspense>
    </Page>
  }