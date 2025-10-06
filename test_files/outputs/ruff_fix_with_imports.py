# This file intentionally breaks as many Python style rules as possible
from collections import *
from typing import Dict, List, Optional, Union

# Bad globals
GLOBAL_VAR=42
another_global   =   "messy"
BadGlobalName="should_be_lowercase"

def   badly_formatted_function(   x,y,z   ):
    unused_var = 42
    another_unused="hello"
    if(x>0):print("positive");print("extra line")
    elif x==0:
        print("zero")
    else:
        print("negative")
    # Missing return
    result=x+y+z
    return result

class   BadClass:
    def __init__( self, value ):
        self.value=value
        self.unused_attr="not used"

    def   method_with_bad_spacing(self,a,b):
        if a>b:return a
        else:return b

    def unused_method(self):
        pass

def function_with_complex_issues(data:Dict[str,Union[str,int]],flag:bool=True)->Optional[List[str]]:
    # Nested function with issues
    def inner_func(x,y):
        if x>y:
            return x
        return y

    results=[]
    unused_inner_var="not used"

    for key,value in data.items():
        if flag:
            if isinstance(value,str):
                if len(value)>0:
                    results.append(value.upper())
                else:
                    results.append("")
            elif isinstance(value,int):
                results.append(str(value))
        else:
            pass

    # Unused variable
    temp_result=inner_func(1,2)

    return results

# Function with docstring issues
def poorly_documented_function(param1,param2=None):
    """
    This is a badly formatted docstring

    It has inconsistent spacing and formatting

    Args:
        param1: first parameter
        param2: second parameter (default: None)

    Returns:
        Something
    """
    if param2 is None:param2=[]
    result=param1+len(param2)
    return result

# Lambda with issues
bad_lambda=lambda x,y:x+y if x>y else y

# List comprehension with issues
messy_list=[x*2for x in range(10)if x%2==0]

# Dictionary with bad formatting
messy_dict={
    'key1':'value1','key2':'value2',
    'key3'   :   'value3'
}

# Try/except with issues
try:
    result=1/0
except:
    print("error occurred")
    pass

# Import in wrong place

# Function with too many arguments
def function_with_many_args(a,b,c,d,e,f,g,h,i,j):
    return a+b+c+d+e+f+g+h+i+j

# Class with no methods
class EmptyClass:
    pass

# Multiple statements on one line
x=1;y=2;z=3

# Bad comparison
if x==True:
    print("bad comparison")

# Unused import at end

# Edge cases where Ruff and Black might differ

# Long string literals - different line breaking strategies
very_long_string = "This is a very long string that should definitely exceed the line length limit and might be handled differently by Black vs Ruff formatters"

# Complex list comprehensions with different formatting preferences
complex_list = [x for x in range(100) if x % 2 == 0 if x > 10 if x < 90]

# Nested function calls with different parameter alignment
result = some_function(very_long_parameter_name,another_very_long_parameter,third_parameter_that_makes_line_long,fourth_param)

# Multi-line dictionary with trailing commas (Black vs Ruff preference)
complex_dict = {"very_long_key_name": "very_long_value_that_exceeds_normal_length","another_long_key": "another_long_value_here","third_key": "third_value",}


# Function with many parameters - wrapping style differences
def function_with_many_parameters_that_exceed_line_length(first_param, second_param, third_param, fourth_param, fifth_param, sixth_param):
    return first_param + second_param


# String concatenation vs f-strings (different tools have preferences)
message = "Hello " + name + ", you have " + str(count) + " messages"

# Complex boolean expressions with different parenthesization
if (very_long_condition_name and another_long_condition_name) or (third_condition and fourth_condition):
    pass

# Trailing commas in function calls - different preferences
result = function_call(argument_one, argument_two, argument_three,)

# Assert statements with comments - Black collapses, Ruff preserves structure
assert (
    condition_a  # comment about condition a
    and condition_b  # comment about condition b
    and condition_c  # comment about condition c
)

# Another assert example that shows formatting differences
assert (very_long_variable_name_that_exceeds_normal_length and another_very_long_condition_that_makes_this_multiline)

# Complex nested assertions
assert (
    (x > 0 and y > 0)  # positive check
    or (x < 0 and y < 0)  # negative check
)

# Missing final newline and trailing whitespace
print("end of file")
