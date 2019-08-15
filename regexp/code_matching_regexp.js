// deconstruct varables & arguments
// https://regex101.com/r/m6NqCf/4
/*
tested with a mixed php, javascript, C#:

    String test = 'bla', String test = "test", return $this->theme_name, $test = ['test'], byte mac = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED }, $test = ['test'], String $test = ['array'], private $theme_name = '', $test, test, $types = [], $post_id = $matches, $post_id = $matches[1], const args_rege = "test", $test = 'test', $test = 123.45, var test = '', local result = hook, Name = "Base", Description = "Base Plugin", Version = "1.0.0", CVars = {}, NextThink = 0, $sponsors = json_decode
*/

//  /(?!$)(?:(?<declaration>const|let|var|local|static|protected|private|return)\s|(?<type>[\w]+)\s)?\s?(?<name>[$&->\w]+)?(?:\s(?<seperator>=)\s)?(?<value>[\d.]+|\[[^\[\]]*\]|{[^{}]*}|'[^']*'|"[^"]*"|[&$\w.\[\]]+)?(?:, |$)/gi

//helps to remove random zero match at the end
//(?!$)


// https://regex101.com/r/m6NqCf/5
//(?!$)(?:(?<declaration>const|let|var|local|static|protected|private|return)\s|(?<type>[\w*]+)\s)?\s?(?<name>[$&\w->()\['"\]]+)?(?:\s(?<seperator>=)\s)?(?<value>[\d.]+|\[[^\[\]]*\]|{[^{}]*}|'[^']*'|"[^"]*"|[&$\w][\w \t.()'"\[\],]+)?(?:,\s|;\s?|$)
/*
tested with:

test['1'], test["1"], test2[][], test3[1],
local name = '';
test = new class('test');
test = test('blabla');
test['test'];
char* test; char* test2[]; char* test3[1][];
$test1 = ''; $test2 = ""; $test3 = {}, $test4 = [];
test, $test, $test = 1, $test = 1.23, $test = '1', $test = '1.23';
$test = "1", $test = "1.23";
$test = ['1'], $test = ['1','2']; $test = {'1'}, $test = {'1,'1.23'};
String test = ''; String test = ""; Object test = {}, Array test = [];
{'1'}, {'1.23'}, ['test'], ['1','1.23']

*/