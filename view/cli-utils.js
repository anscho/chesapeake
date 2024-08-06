// Reusable CLI code

// "a,b,c" => [a, b, c]
const parse_comma_separated_list = arg => {
  if (!arg) {
    return null
  }

  if (!`${arg}`.includes(',')) {
    return [arg]
  }

  return arg.split(',')
}

export default {
  parse_comma_separated_list
}
