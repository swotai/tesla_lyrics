# Async running in parallel vs serial

Await within async blocks the next line untile promises resolves

This is parallel

``` javascript
const test = async _ => {
  const promises = [getOne(), getTwo(), getThree()]
  console.log('Now')

  const [one, two, three] = await Promise.all(promises)
  console.log(one)
  console.log(two)
  console.log(three)

  console.log('Done')
}

test()
```

This is serial

``` javascript
const test = async _ => {
  const one = await getOne()
  console.log(one)

  const two = await getTwo()
  console.log(two)

  const three = await getThree()
  console.log(three)

  console.log('Done')
}

test()
```

[Ref](https://zellwk.com/blog/async-await-in-loops/)
