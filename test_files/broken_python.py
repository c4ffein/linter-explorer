# This file intentionally breaks as many Python style rules as possible
import   os,sys,json,re
import unused_module_1
import unused_module_2
from   collections   import   *
import  typing
from typing import Dict,List,Optional,Union
import math
import datetime
import pathlib
import subprocess

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
import random

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
import collections

# Missing final newline and trailing whitespace
print("end of file")