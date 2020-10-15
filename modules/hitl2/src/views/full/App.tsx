import React, { useContext, useEffect, useState } from 'react'
import _ from 'lodash'

import { Api, castEscalation } from './Api'
import { Context } from './app/Store'

import { SocketMessageType } from './../../types'

import { toast } from 'botpress/shared'
import { Grid, Row, Col } from 'react-flexbox-grid'

import AgentProfile from './Components/AgentProfile'
import Conversation from './Components/Conversation'
import EscalationList from './Components/EscalationList'

import style from './style.scss'

const App = ({ bp }) => {
  const api = Api(bp)

  const { state, dispatch } = useContext(Context)

  const [loading, setLoading] = useState(true)

  function handleMessage(message: SocketMessageType) {
    console.log('handleMessage')
    switch (message.resource) {
      case 'agent':
        return dispatch({ type: 'setAgent', payload: message })
      case 'escalation':
        return dispatch({
          type: 'setEscalation',
          payload: _.thru(message, () => {
            message.payload = castEscalation(message.payload)
            return message
          })
        })
      default:
        return
    }
  }

  async function getCurrentAgent() {
    try {
      const agent = await api.getCurrentAgent()
      dispatch({ type: 'setCurrentAgent', payload: agent })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  async function getAgents() {
    try {
      const agents = await api.getAgents()
      dispatch({ type: 'setAgents', payload: agents })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  async function getEscalations() {
    try {
      const escalations = await api.getEscalations()
      dispatch({ type: 'setEscalations', payload: escalations })
    } catch (error) {
      dispatch({ type: 'setError', payload: error })
    }
  }

  useEffect(() => {
    Promise.all([getCurrentAgent(), getAgents(), getEscalations()]).then(() => {
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    bp.events.on('hitl2', handleMessage)
    return () => bp.events.off('hitl2', handleMessage)
  }, [])

  useEffect(() => {
    if (state.error) {
      if (state.error.response) {
        toast.failure(`Error: ${state.error.response.data.message}`)
      } else {
        toast.failure(`Error: ${state.error}`)
      }
    }
  }, [state.error])

  return (
    <Grid>
      <Row>
        <Col>{state.currentAgent ? <AgentProfile api={api} {...state.currentAgent}></AgentProfile> : null}</Col>
        <Col></Col>
      </Row>
      <Row>
        <Col md={4}>
          <EscalationList api={api} escalations={state.escalations} loading={loading}></EscalationList>
        </Col>
        <Col md={8}>
          <Conversation api={api} escalation={state.currentEscalation}></Conversation>
        </Col>
      </Row>
    </Grid>
  )
}

export default App
