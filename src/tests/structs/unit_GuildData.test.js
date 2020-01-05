const GuildData = require('../../structs/GuildData.js')
const GuildProfile = require('../../structs/db/GuildProfile.js')
const Feed = require('../../structs/db/Feed.js')
const Format = require('../../structs/db/Format.js')
const Subscriber = require('../../structs/db/Subscriber.js')

jest.mock('../../structs/db/GuildProfile.js')
jest.mock('../../structs/db/Feed.js')
jest.mock('../../structs/db/Format.js')
jest.mock('../../structs/db/Subscriber.js')

describe('Unit::structs/GuildData', function () {
  const initData = {
    feeds: [],
    formats: [],
    subscribers: []
  }
  afterEach(function () {
    GuildProfile.mockReset()
    GuildProfile.get.mockReset()
    Feed.mockReset()
    Feed.getManyBy.mockReset()
    Format.mockReset()
    Subscriber.mockReset()
  })
  describe('constructor', function () {
    it(`throws error if feeds don't match the guild`, function () {
      const profile = {
        _id: 'id1'
      }
      const feeds = [{
        _id: 'abc',
        guild: 'id2'
      }]
      const data = {
        profile,
        feeds
      }
      expect(() => new GuildData(data))
        .toThrow(`Feed abc does not match profile`)
    })
    it(`throws error if formats don't match any feeds`, function () {
      const feeds = [{
        _id: 'abc',
        guild: 'id2'
      }]
      const formats = [{
        _id: 'whatever',
        feed: 'abh'
      }]
      const data = {
        feeds,
        formats
      }
      expect(() => new GuildData(data))
        .toThrow(`Format whatever does not match any given feeds`)
    })
    it(`throws error if subscribers don't match any feeds`, function () {
      const feeds = [{
        _id: 'abc',
        guild: 'id2'
      }]
      const subscribers = [{
        _id: 'whatever',
        feed: 'abh'
      }]
      const data = {
        feeds,
        subscribers,
        formats: []
      }
      expect(() => new GuildData(data))
        .toThrow(`Subscriber whatever does not match any given feeds`)
    })
    it('throws for multiple guild ids found for feeds', function () {
      const feeds = [{
        guild: 'a'
      }, {
        guild: 'b'
      }]
      const data = {
        feeds,
        subscribers: [],
        formats: []
      }
      expect(() => new GuildData(data))
        .toThrow('Mismatched guild IDs found for feeds')
    })
    it('sets the instance vars', function () {
      const profile = {
        _id: 'id2'
      }
      const feeds = [{
        _id: 'abc',
        guild: 'id2'
      }]
      const subscribers = [{
        _id: 'whatever',
        feed: 'abc'
      }]
      const formats = [{
        _id: 'formz',
        feed: 'abc'
      }]
      const data = {
        profile,
        feeds,
        subscribers,
        formats
      }
      const guildData = new GuildData(data)
      expect(guildData.id).toEqual('id2')
      expect(guildData.profile).toEqual(profile)
      expect(guildData.feeds).toEqual(feeds)
      expect(guildData.subscribers).toEqual(subscribers)
      expect(guildData.formats).toEqual(formats)
    })
  })
  describe('toJSON', function () {
    it('returns this.data', function () {
      const guildData = new GuildData({ ...initData })
      guildData.data = 123
      expect(guildData.toJSON()).toEqual(123)
    })
  })
  describe('static get', function () {
    it('returns an instance of GuildData', async function () {
      GuildProfile.get.mockResolvedValue(null)
      Feed.getManyBy.mockResolvedValue([])
      const returned = await GuildData.get()
      expect(returned).toBeInstanceOf(GuildData)
    })
  })
  describe('restore', function () {
    it('calls delete first', async function () {
      const guildData = new GuildData({ ...initData })
      const spy = jest.spyOn(guildData, 'delete')
      await guildData.restore()
      expect(spy).toHaveBeenCalledTimes(1)
    })
    it('creates the relevant models', async function () {
      const guildData = new GuildData({ ...initData })
      const profile = {
        foo: 1
      }
      const feeds = [{
        a: 1
      }, {
        b: 2
      }]
      const formats = [{
        f: 1
      }, {
        g: 2
      }]
      const subscribers = [{
        s: 1
      }, {
        q: 2
      }]
      guildData.profile = profile
      guildData.feeds = feeds
      guildData.formats = formats
      guildData.subscribers = subscribers
      await guildData.restore()
      expect(GuildProfile).toHaveBeenCalledWith(profile)
      feeds.forEach(f => expect(Feed).toHaveBeenCalledWith(f))
      formats.forEach(f => expect(Format).toHaveBeenCalledWith(f))
      subscribers.forEach(s => expect(Subscriber).toHaveBeenCalledWith(s))
    })
    it('does not create a GuildProfile if profile does not exist', async function () {
      const guildData = new GuildData({ ...initData })
      delete guildData.profile
      const feeds = [{
        a: 1
      }, {
        b: 2
      }]
      guildData.feeds = feeds
      await guildData.restore()
      expect(GuildProfile).not.toHaveBeenCalled()
    })
    it('calls save on all relevant models', async function () {
      const guildData = new GuildData({ ...initData })
      const profile = {
        foo: 1
      }
      const feeds = [{
        a: 1
      }, {
        b: 2
      }]
      const formats = [{
        f: 1
      }, {
        g: 2
      }]
      const subscribers = [{
        s: 1
      }, {
        q: 2
      }]
      guildData.profile = profile
      guildData.feeds = feeds
      guildData.formats = formats
      guildData.subscribers = subscribers
      await guildData.restore()
      expect(GuildProfile.mock.instances[0].save).toHaveBeenCalledTimes(1)
      feeds.forEach((f, i) => expect(Feed.mock.instances[i].save).toHaveBeenCalledTimes(1))
      formats.forEach((f, i) => expect(Format.mock.instances[i].save).toHaveBeenCalledTimes(1))
      subscribers.forEach((s, i) => expect(Subscriber.mock.instances[i].save).toHaveBeenCalledTimes(1))
    })
    it('calls delete on all models if some saves fail', async function () {
      const guildData = new GuildData({ ...initData })
      const profile = {
        foo: 1
      }
      const feeds = [{
        a: 1
      }, {
        b: 2
      }]
      const formats = [{
        f: 1
      }, {
        g: 2
      }]
      const subscribers = [{
        s: 1
      }, {
        q: 2
      }]
      guildData.profile = profile
      guildData.feeds = feeds
      guildData.formats = formats
      guildData.subscribers = subscribers
      Subscriber.prototype.save.mockRejectedValue(new Error('save error'))
      try {
        await guildData.restore()
      } catch (err) {}
      expect(GuildProfile.mock.instances[0].delete).toHaveBeenCalledTimes(1)
      feeds.forEach((f, i) => expect(Feed.mock.instances[i].delete).toHaveBeenCalledTimes(1))
      formats.forEach((f, i) => expect(Format.mock.instances[i].delete).toHaveBeenCalledTimes(1))
      subscribers.forEach((s, i) => expect(Subscriber.mock.instances[i].delete).toHaveBeenCalledTimes(1))
      Subscriber.prototype.save.mockRestore()
    })
    it('throws the error from save if some save fails', async function () {
      const guildData = new GuildData({ ...initData })
      const profile = {
        foo: 1
      }
      const feeds = [{
        a: 1
      }, {
        b: 2
      }]
      guildData.profile = profile
      guildData.feeds = feeds
      guildData.formats = []
      guildData.subscribers = []
      const error = new Error('save error')
      Feed.prototype.save.mockRejectedValue(error)
      await expect(guildData.restore()).rejects.toThrow(error)
      Feed.prototype.save.mockRestore()
    })
    it('throws save error if delete fails', async function () {
      const guildData = new GuildData({ ...initData })
      const profile = {
        foo: 1
      }
      const feeds = [{
        a: 1
      }, {
        b: 2
      }]
      guildData.profile = profile
      guildData.feeds = feeds
      guildData.formats = []
      guildData.subscribers = []
      const saveError = new Error('save error')
      Feed.prototype.save.mockRejectedValue(saveError)
      Feed.prototype.delete.mockRejectedValue(new Error('delete error'))
      await expect(guildData.restore()).rejects.toThrow(saveError)
      Feed.prototype.save.mockRestore()
      Feed.prototype.delete.mockRestore()
    })
  })
  describe('isEmpty', function () {
    it('returns true if there is no profile and no feeds', function () {
      const guildData = new GuildData({ ...initData })
      guildData.profile = null
      guildData.feeds = []
      expect(guildData.isEmpty()).toEqual(true)
    })
    it('returns false for either populated feeds or populated profile', function () {
      const guildData = new GuildData({ ...initData })
      guildData.profile = {}
      guildData.feeds = []
      expect(guildData.isEmpty()).toEqual(false)
      guildData.profie = null
      guildData.feeds = [{}]
      expect(guildData.isEmpty()).toEqual(false)
      guildData.profie = {}
      guildData.feeds = [{}]
      expect(guildData.isEmpty()).toEqual(false)
    })
  })
  describe('delete', function () {
    it('calls delete on all found data', async function () {
      const profile = {
        _id: 'profile'
      }
      const feeds = [{
        _id: 1,
        guild: 'profile'
      }, {
        _id: 2,
        guild: 'profile'
      }]
      const subscribers = [{
        _id: 1,
        feed: 1
      }, {
        _id: 1,
        feed: 1
      }]
      const formats = [{
        _id: 1,
        feed: 1
      }, {
        _id: 1,
        feed: 1
      }]
      const foundProfile = { delete: jest.fn() }
      const foundFeed1 = { delete: jest.fn() }
      const foundFeed2 = { delete: jest.fn() }
      const foundSubscriber1 = { delete: jest.fn() }
      const foundSubscriber2 = { delete: jest.fn() }
      const foundFormat1 = { delete: jest.fn() }
      const foundFormat2 = { delete: jest.fn() }
      GuildProfile.get
        .mockResolvedValue(foundProfile)
      Feed.get
        .mockResolvedValueOnce(foundFeed1)
        .mockResolvedValueOnce(foundFeed2)
      Subscriber.get
        .mockResolvedValueOnce(foundSubscriber1)
        .mockResolvedValueOnce(foundSubscriber2)
      Format.get
        .mockResolvedValueOnce(foundFormat1)
        .mockResolvedValueOnce(foundFormat2)
      const guildData = new GuildData({
        profile,
        feeds,
        subscribers,
        formats
      })
      await guildData.delete()
      expect(foundProfile.delete).toHaveBeenCalledTimes(1)
      expect(foundFeed1.delete).toHaveBeenCalledTimes(1)
      expect(foundFeed2.delete).toHaveBeenCalledTimes(1)
      expect(foundFormat1.delete).toHaveBeenCalledTimes(1)
      expect(foundFormat2.delete).toHaveBeenCalledTimes(1)
      expect(foundSubscriber1.delete).toHaveBeenCalledTimes(1)
      expect(foundSubscriber2.delete).toHaveBeenCalledTimes(1)
      GuildProfile.get.mockReset()
      Feed.get.mockReset()
      Subscriber.get.mockReset()
      Format.get.mockReset()
    })
    it('calls delete on partially found data', async function () {
      const profile = {
        _id: 'profile'
      }
      const feeds = [{
        _id: 1,
        guild: 'profile'
      }]
      const subscribers = []
      const formats = [{
        _id: 1,
        feed: 1
      }]
      const foundProfile = { delete: jest.fn() }
      const foundFeed1 = { delete: jest.fn() }
      const foundFormat1 = { delete: jest.fn() }
      GuildProfile.get
        .mockResolvedValue(foundProfile)
      Feed.get
        .mockResolvedValueOnce(foundFeed1)
      Format.get
        .mockResolvedValueOnce(foundFormat1)
      const guildData = new GuildData({
        profile,
        feeds,
        subscribers,
        formats
      })
      await guildData.delete()
      expect(foundProfile.delete).toHaveBeenCalledTimes(1)
      expect(foundFeed1.delete).toHaveBeenCalledTimes(1)
      expect(foundFormat1.delete).toHaveBeenCalledTimes(1)
    })
  })
})
